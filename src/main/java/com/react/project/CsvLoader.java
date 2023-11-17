package com.react.project;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.react.project.entity.IntroduceDataEntity;
import com.react.project.service.IntroduceDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.io.FileReader;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CsvLoader {

    @Autowired
    private IntroduceDataService introduceDataService;

    public void loadCsvAndSave() {
        String csvFile = "C:\\Users\\jwoo3\\OneDrive\\바탕 화면\\intro\\translatedQuestionList.csv"; // 번역된 CSV 파일 경로를 지정하세요.

        try (CSVReader reader = new CSVReader(new FileReader(csvFile))) {
            String[] line;
            reader.readNext(); // 헤더 행을 건너뛰기
            int count = 0;
            while ((line = reader.readNext()) != null) {
                IntroduceDataEntity introduceData = new IntroduceDataEntity();

                String[] nltkKeywords = line[1].split(","); // NLTK Keywords 컬럼 파싱
                if (nltkKeywords.length > 0 && nltkKeywords[0] != null) {
                    introduceData.setIntroStandardCompany(nltkKeywords[0].trim()); // 첫 단어를 introStandardCompany로 설정
                } else {
                    // nltkKeywords가 비어있거나 null일 때의 처리 로직
                    System.err.println("Invalid nltkKeywords: " + Arrays.toString(nltkKeywords));
                    introduceData.setIntroStandardCompany(""); // 빈 문자열로 설정하거나 다른 예외 처리를 수행
                }

                introduceData.setIntroStandardContent(line[3]);

                String translatedQuestions = String.join(", ", eval(line[4])); // 번역된 GPT Questions
                introduceData.setIntroQuestion(translatedQuestions);

                introduceDataService.saveIntroduceData(introduceData);
                System.out.println("Processed count: " + ++count); // 현재 처리된 라인 수 출력
            }
        } catch (IOException | CsvValidationException e) {
            e.printStackTrace();
        }
    }

    private List<String> eval(String str) {
        if (str == null || str.length() < 3) { // 대괄호와 최소한 하나의 문자가 있어야 함
            return Collections.emptyList(); // 빈 리스트 반환
        }
        // 대괄호 제거
        String noBrackets = str.substring(1, str.length() - 1);
        if (noBrackets.isEmpty()) { // 대괄호 사이에 문자열이 없는 경우
            return Collections.emptyList(); // 빈 리스트 반환
        }

        // ', '를 기준으로 문자열 분리
        String[] split = noBrackets.split("', '");

        // 앞뒤 단일 따옴표 제거 및 리스트로 변환
        return Arrays.stream(split)
                .map(s -> {
                    if (s.length() < 2) { // 단일 따옴표가 없는 경우
                        return s;
                    }
                    return s.substring(1, s.length() - 1); // 앞뒤 단일 따옴표 제거
                })
                .collect(Collectors.toList());
    }

}
