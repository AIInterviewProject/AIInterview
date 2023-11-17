package com.react.project.controller;

import com.react.project.entity.PayDataEntity;
import com.react.project.repository.PayDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api")
public class PaymentController {

    @Autowired
    private PayDataRepository payDataRepository;

    @PostMapping("/save-payment")
    public ResponseEntity<?> savePaymentData(@RequestBody PayDataEntity payData) {
        try {
            // 사용자 이메일로 기존 데이터 조회
            Optional<PayDataEntity> existingData = payDataRepository.findById(payData.getUserEmail());

            // 기존 데이터가 있을 경우, days 값을 업데이트
            if (existingData.isPresent()) {
                PayDataEntity existingEntity = existingData.get();
                existingEntity.setDays(existingEntity.getDays() + payData.getDays());
                payDataRepository.save(existingEntity);
            } else {
                // 기존 데이터가 없을 경우, 새로운 데이터 저장
                payDataRepository.save(payData);
            }

            return new ResponseEntity<>(HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/get-days")
    public ResponseEntity<Integer> getDaysForUser(@RequestParam String userEmail) {
        try {
            Optional<PayDataEntity> existingData = payDataRepository.findById(userEmail);
            if (existingData.isPresent()) {
                return new ResponseEntity<>(existingData.get().getDays(), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(0, HttpStatus.OK);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
