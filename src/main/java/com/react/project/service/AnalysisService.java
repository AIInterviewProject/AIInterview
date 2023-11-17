package com.react.project.service;

import com.react.project.AnalysisResult;
import kr.co.shineware.nlp.komoran.constant.DEFAULT_MODEL;
import kr.co.shineware.nlp.komoran.core.Komoran;
import kr.co.shineware.nlp.komoran.model.KomoranResult;
import kr.co.shineware.util.common.model.Pair;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.ResourceUtils;
import org.json.simple.parser.ParseException;

import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.search.similarities.ClassicSimilarity;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.BooleanQuery;
import org.springframework.web.client.RestTemplate;

import java.io.FileReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.io.IOException;
import java.util.Map;

import com.react.project.OpenAIApi;

@Service
public class AnalysisService {
    static {
        BooleanQuery.setMaxClauseCount(4096);  // 설정
    }
    private final Komoran komoran;
    private List<String> storedTexts;
    private List<JSONObject> keywordDataList;

    private final String CLOVA_API_URL = "https://naveropenapi.apigw.ntruss.com/sentiment-analysis/v1/analyze";
    private final String API_KEY_ID = "uo316pxscv";
    private final String API_KEY = "SRsgIkbWRJvew5g4NB7yIg0t9l2UyA5qnn7Po7S3";

    public AnalysisService() throws Exception {
        this.komoran = new Komoran(DEFAULT_MODEL.FULL);
        this.storedTexts = loadStoredTexts();
        this.keywordDataList = loadKeywordData();
    }

    public AnalysisResult analyze(String content) {
        AnalysisResult result = new AnalysisResult();

        // 유사도 측정
        double similarity = computeSimilarity(content);
        result.setSimilarity(similarity);

        // 표절도 검사
        boolean isPlagiarized = (similarity > 0.9); // 임의의 임계값
        result.setIsPlagiarized(isPlagiarized);

        // 맞춤법 검사
        List<String> correctedTexts = new ArrayList<>();
        String[] contents = content.split("\n\n");  // 문제와 내용 조합을 분리합니다.
        for (String text : contents) {
            correctedTexts.add(checkSpellingWithGPT(text));
        }
        result.setCorrectedTexts(correctedTexts);

        return result;
    }

    private List<String> loadStoredTexts() throws Exception {
        List<String> texts = new ArrayList<>();
        JSONParser parser = new JSONParser();

        FileReader reader = new FileReader(ResourceUtils.getFile("classpath:intro_full.json"));

        Object obj = parser.parse(reader);
        JSONArray jsonArray = (JSONArray) obj;

        for (Object jsonObject : jsonArray) {
            JSONObject textObj = (JSONObject) jsonObject;
            texts.add(textObj.get("Content").toString());
        }

        return texts;
    }

    private double computeSimilarity(String content) {
        double maxSimilarity = 0.0;

        for (String storedText : storedTexts) {
            double similarity = calculateCosineSimilarity(content, storedText);
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
            }
        }

        return maxSimilarity;
    }

    private double calculateCosineSimilarity(String text1, String text2) {
        try {
            Directory directory = new RAMDirectory();
            StandardAnalyzer analyzer = new StandardAnalyzer();
            IndexWriterConfig config = new IndexWriterConfig(analyzer);
            IndexWriter writer = new IndexWriter(directory, config);

            addDocument(writer, escapeSpecialChars(text1));
            addDocument(writer, escapeSpecialChars(text2));
            writer.close();

            IndexReader reader = DirectoryReader.open(directory);
            IndexSearcher searcher = new IndexSearcher(reader);
            searcher.setSimilarity(new ClassicSimilarity());

            QueryParser parser = new QueryParser("content", analyzer);
            Query query = parser.parse(escapeSpecialChars(text2));
            TopDocs results = searcher.search(query, 2);

            if (results.totalHits.value >= 1) {
                return results.scoreDocs[0].score;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0.0;
    }

    private static void addDocument(IndexWriter w, String content) throws IOException {
        Document doc = new Document();
        doc.add(new TextField("content", content, Field.Store.YES));
        w.addDocument(doc);
    }

    private String escapeSpecialChars(String text) {
        String[] specialChars = new String[]{"\\", "+", "-", "&&", "||", "!", "(", ")", "{", "}", "[", "]", "^", "~", "*", "?", ":", "/"};
        for (String specialChar : specialChars) {
            text = text.replace(specialChar, "\\" + specialChar);
        }
        return text;
    }

    public String checkSpellingWithGPT(String text) {
        OpenAIApi openai = new OpenAIApi();
        String prompt = text + "이 텍스트에서 맞춤법 검사해서 고칠 점만 말해줘";
        String correctedText = openai.askAnalysis(prompt);

        return correctedText;
    }

    private List<JSONObject> loadKeywordData() throws Exception {
        JSONParser parser = new JSONParser();
        List<JSONObject> keywordDataList = new ArrayList<>();

        // 각 키워드 파일의 이름을 명시적으로 지정
        String[] fileNames = {
                "global.json",
                "active.json",
                "challenge.json",
                "sincerity.json",
                "communication.json",
                "patience.json",
                "honesty.json",
                "responsibility.json",
                "creative.json",
                "teamwork.json",
        };

        for (String fileName : fileNames) {
            FileReader reader = new FileReader(ResourceUtils.getFile("classpath:" + fileName));
            Object parsedObj = parser.parse(reader);
            if (parsedObj instanceof JSONArray) {
                JSONArray jsonArray = (JSONArray) parsedObj;
                for (Object obj : jsonArray) {
                    if (obj instanceof JSONArray) {
                        JSONArray keywordArray = (JSONArray) obj;
                        String keywordName = (String) keywordArray.get(0);
                        JSONArray keywords = (JSONArray) keywordArray.get(1);
                        JSONObject keywordData = new JSONObject();
                        keywordData.put(keywordName, keywords);
                        keywordDataList.add(keywordData);
                    } else {
                        System.err.println("Expected JSONArray but found " + obj.getClass().getName());
                    }
                }
            } else {
                System.err.println("Expected JSONArray but found " + parsedObj.getClass().getName());
            }
        }
        return keywordDataList;
    }



    public List<JSONObject> analyzeKeywords(String content) {
        List<JSONObject> results = new ArrayList<>();
        for (JSONObject keywordData : keywordDataList) {
            JSONObject result = new JSONObject();
            KomoranResult komoranResult = komoran.analyze(content);
            List<Pair<String, String>> singleResult = komoranResult.getList();
            List<List<Pair<String, String>>> analyzedResult = new ArrayList<>();
            analyzedResult.add(singleResult);

            for (List<Pair<String, String>> wordList : analyzedResult) {
                for (Pair<String, String> word : wordList) {
                    String term = word.getFirst();
                    for (Object key : keywordData.keySet()) {
                        JSONArray keywords = (JSONArray) keywordData.get(key);
                        if (keywords.contains(term)) {
                            if (result.containsKey(key)) {
                                result.put(key, (int) result.get(key) + 1);
                            } else {
                                result.put(key, 1);
                            }
                        }
                    }
                }
            }
            if (!result.isEmpty()) {
                results.add(result);
            }
        }
        return results;
    }

    public Map<String, Integer> getAnalysisResults(String content) {
        List<JSONObject> keywordAnalysis = analyzeKeywords(content);
        Map<String, Integer> resultMap = new HashMap<>();

        for (JSONObject jsonObject : keywordAnalysis) {
            for (Object key : jsonObject.keySet()) {
                resultMap.put((String) key, (int) jsonObject.get(key));
            }
        }
        return resultMap;
    }

    public String interviewAnswerAnalysis(String content) {
        RestTemplate restTemplate = new RestTemplate();

        // HTTP 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-NCP-APIGW-API-KEY-ID", API_KEY_ID);
        headers.set("X-NCP-APIGW-API-KEY", API_KEY);
        headers.set("Content-Type", "application/json");

        // 요청 본문 생성
        Map<String, String> body = new HashMap<>();
        body.put("content", content);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        // API 요청
        ResponseEntity<String> response = restTemplate.exchange(CLOVA_API_URL, HttpMethod.POST, entity, String.class);

        // 응답 본문 반환
        return response.getBody();
    }

}