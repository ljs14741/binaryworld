package com.example.binaryworld.controller;

import com.example.binaryworld.dto.GuestbookDTO;
import com.example.binaryworld.service.GuestbookService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * 관리자 페이지: 공용 방명록에 개발자 답변 달기.
 * 비밀번호는 wedding 과 같은 ADMIN_SECRET 환경변수 (infra docker-compose.yml). 12자 미만이면 로그인 막음.
 */
@Controller
@RequiredArgsConstructor
public class AdminController {

    private static final String SESSION_KEY = "bwAdmin";
    private static final int MIN_SECRET_LENGTH = 12;
    // 비밀번호 5번 틀리면 10분 잠금 (서버 전체 기준)
    private static final int MAX_FAILS = 5;
    private static final long LOCK_MS = 10 * 60 * 1000L;

    private final GuestbookService guestbookService;

    @Value("${ADMIN_SECRET:}")
    private String adminSecret;

    private int fails = 0;
    private long lockedUntil = 0;

    @GetMapping("/admin")
    public String admin(@RequestParam(defaultValue = "0") int page, HttpSession session, Model model) {
        if (!isAdmin(session)) {
            model.addAttribute("configured", adminSecret != null && adminSecret.length() >= MIN_SECRET_LENGTH);
            return "admin/login";
        }
        Page<GuestbookDTO> items = guestbookService.getPaged(Math.max(page, 0), 20);
        model.addAttribute("items", items);
        return "admin/guestbook";
    }

    @PostMapping("/admin/login")
    public String login(@RequestParam String password, HttpServletRequest request, RedirectAttributes ra) {
        synchronized (this) {
            if (System.currentTimeMillis() < lockedUntil) {
                ra.addFlashAttribute("error", "비밀번호를 여러 번 틀려서 10분 동안 잠겼습니다.");
                return "redirect:/admin";
            }
            if (!matches(password)) {
                if (++fails >= MAX_FAILS) {
                    lockedUntil = System.currentTimeMillis() + LOCK_MS;
                    fails = 0;
                }
                ra.addFlashAttribute("error", "비밀번호가 올바르지 않습니다.");
                return "redirect:/admin";
            }
            fails = 0;
        }
        // 세션 고정 공격 막기: 로그인하면 세션 id 새로
        HttpSession old = request.getSession(false);
        if (old != null) old.invalidate();
        request.getSession(true).setAttribute(SESSION_KEY, true);
        return "redirect:/admin";
    }

    @PostMapping("/admin/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/admin";
    }

    @PostMapping("/admin/guestbook/{id}/reply")
    public String reply(@PathVariable Long id, @RequestParam(defaultValue = "") String reply,
                        @RequestParam(defaultValue = "0") int page, HttpSession session, RedirectAttributes ra) {
        if (!isAdmin(session)) return "redirect:/admin";
        // 답변 2000자 제한
        String text = reply.length() > 2000 ? reply.substring(0, 2000) : reply;
        boolean ok = guestbookService.reply(id, text);
        ra.addFlashAttribute("notice", !ok ? "글을 찾을 수 없습니다." : text.isBlank() ? "답변을 지웠습니다." : "답변을 저장했습니다.");
        return "redirect:/admin?page=" + page + "#gb-" + id;
    }

    private boolean isAdmin(HttpSession session) {
        return Boolean.TRUE.equals(session.getAttribute(SESSION_KEY));
    }

    private boolean matches(String input) {
        if (adminSecret == null || adminSecret.length() < MIN_SECRET_LENGTH || input == null) return false;
        return MessageDigest.isEqual(input.trim().getBytes(StandardCharsets.UTF_8), adminSecret.getBytes(StandardCharsets.UTF_8));
    }
}
