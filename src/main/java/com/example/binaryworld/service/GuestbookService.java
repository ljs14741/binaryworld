package com.example.binaryworld.service;

import com.example.binaryworld.dto.GuestbookDTO;
import com.example.binaryworld.entity.Guestbook;
import com.example.binaryworld.repository.GuestbookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GuestbookService {

    private final GuestbookRepository guestbookRepository;

    // 예전에 평문으로 저장된 비밀번호를 켜질 때 한 번 해시로 바꿈 (공용 테이블이라 메인에서만 함, 이미 바꾼 건 건너뜀)
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void hashLegacyPasswords() {
        List<Guestbook> legacy = guestbookRepository.findAll().stream()
                .filter(g -> g.getPassword() != null && !GuestbookPassword.isHashed(g.getPassword()))
                .collect(Collectors.toList());
        legacy.forEach(g -> g.setPassword(GuestbookPassword.hash(g.getPassword())));
        guestbookRepository.saveAll(legacy);
        if (!legacy.isEmpty()) log.info("방명록 평문 비밀번호 {}건을 해시로 바꿈", legacy.size());
    }

    // 등록
    public void create(GuestbookDTO dto) {
        Guestbook guestbook = Guestbook.builder()
                .nickname(dto.getNickname())
                .password(GuestbookPassword.hash(dto.getPassword()))
                .content(dto.getContent())
                .build();
        guestbookRepository.save(guestbook);
    }

    // 전체 조회 (password는 응답에 포함 안 됨)
    public List<GuestbookDTO> getAll() {
        return guestbookRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(g -> GuestbookDTO.builder()
                        .id(g.getId())
                        .nickname(g.getNickname())
                        .content(g.getContent())
                        .createdAt(g.getCreatedAt())
                        .reply(g.getReply())
                        .repliedAt(g.getRepliedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // 삭제
    public boolean delete(Long id, String password) {
        return guestbookRepository.findById(id)
                .filter(g -> GuestbookPassword.matches(password, g.getPassword()))
                .map(g -> {
                    guestbookRepository.delete(g);
                    return true;
                })
                .orElse(false);
    }

    public Page<GuestbookDTO> getPaged(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return guestbookRepository.findAll(pageRequest)
                .map(g -> GuestbookDTO.builder()
                        .id(g.getId())
                        .nickname(g.getNickname())
                        .content(g.getContent())
                        .createdAt(g.getCreatedAt())
                        .reply(g.getReply())
                        .repliedAt(g.getRepliedAt())
                        .build());
    }

    // 개발자 답변 달기·고치기. 빈 내용이면 답변을 지움
    public boolean reply(Long id, String text) {
        String t = text == null ? "" : text.trim();
        return guestbookRepository.findById(id)
                .map(g -> {
                    g.setReply(t.isEmpty() ? null : t);
                    g.setRepliedAt(t.isEmpty() ? null : LocalDateTime.now());
                    guestbookRepository.save(g);
                    return true;
                })
                .orElse(false);
    }
}
