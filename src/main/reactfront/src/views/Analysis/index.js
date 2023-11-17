import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Button,
    TextField,
    Container,
    Typography,
    Box,
    IconButton,
    Dialog,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCookies } from "react-cookie";
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { BarController, BarElement, CategoryScale, LinearScale, Chart } from 'chart.js';
import { Paper } from '@mui/material';
import Loading from "../../components/Loading";
import analysisImage from '../../assets/images/analysis.gif';

Chart.register(BarController, BarElement, CategoryScale, LinearScale);

function Analysis() {
    const [view, setView] = useState('start');
    const [questions, setQuestions] = useState(["", "", ""]);
    const [answers, setAnswers] = useState(["", "", ""]);
    const [result, setResult] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [titlesList, setTitlesList] = useState([]);
    const [cookies] = useCookies(['token']);
    const [loading, setLoading] = useState(false);
    const [spellingCheckResult, setSpellingCheckResult] = useState([]);
    const chartRef = useRef(null);
    const [chartInstance, setChartInstance] = useState(null);
    const [userName, setUserName] = useState('');

    const initialChartData = {
        labels: [],
        datasets: []
    };

    const [chartData, setChartData] = useState(initialChartData);

    const analysisResults = {
        글로벌역량: 75,
        능동: 85,
        도전: 65,
        성실: 90,
        소통: 70,
        인내심: 60,
        정직: 80,
        주인의식: 85,
        창의: 70,
        팀워크: 90
    };

    useEffect(() => {
        // 여기서 서버에서 데이터를 가져옵니다.
        const fetchAnalysisResults = async () => {
            try {
                const combinedText = questions.map((q, index) => `${q}\n${answers[index]}`).join('\n\n');
                const response = await axios.post('/api/getAnalysisResults', combinedText);
                const data = response.data;

                const updatedChartData = {
                    labels: Object.keys(data),
                    datasets: [
                        {
                            label: '성향 분석 결과',
                            data: Object.values(data),
                            backgroundColor: 'rgba(75,192,192,0.6)',
                            borderColor: 'rgba(75,192,192,1)',
                            borderWidth: 1,
                            hoverBackgroundColor: 'rgba(75,192,192,0.4)',
                            hoverBorderColor: 'rgba(75,192,192,1)'
                        }
                    ]
                };
                setChartData(updatedChartData);
            } catch (error) {
                console.error("Error fetching analysis results:", error);
            }
        };

        fetchAnalysisResults();
    }, [questions, answers]);

    useEffect(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }
    }, [chartData]);

    const fetchUserEmail = async () => {
        const token = cookies.token;
        if (token) {
            try {
                const userDetails = await axios.get('/api/auth/currentUser', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUserEmail(userDetails.data.userEmail);
            } catch (error) {
                console.error("Error fetching user email:", error);
            }
        }
    };

    useEffect(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }
    }, [chartData]);

    const handleStartAnalysis = () => {
        setView('write');
    };

    const handleCheck = async () => {
        setView('loading');
        let correctedTextAccumulator = [];

        try {
            const combinedText = questions.map((q, index) => `${q}\n${answers[index]}`).join('\n\n');
            const plagiarismResponse = await axios.post('/api/checkPlagiarism', { content: combinedText });
            setResult(plagiarismResponse.data);

            for (let i = 0; i < questions.length; i++) {
                const textPair = `${questions[i]}\n${answers[i]}`;
                const spellingCheckResponse = await axios.post('/api/checkSpellingWithGPT', { text: textPair });
                if (spellingCheckResponse.data && spellingCheckResponse.data.corrected_text) {
                    correctedTextAccumulator.push(spellingCheckResponse.data.corrected_text);
                } else {
                    correctedTextAccumulator.push("Error: Could not fetch corrected text");
                }
            }

            // 키워드 분석 API 호출
            const keywordAnalysisResponse = await axios.post('/api/analyzeKeywords', { content: combinedText });
            const keywordAnalysisResults = keywordAnalysisResponse.data;

            // API 응답을 그래프 데이터로 변환
            const labels = keywordAnalysisResults.map(result => Object.keys(result)[0]);
            const data = keywordAnalysisResults.map(result => Object.values(result)[0]);

            setChartData({
                labels: labels,
                datasets: [{
                    label: '키워드 분석 결과',
                    data: data,
                    backgroundColor: 'rgba(75,192,192,0.6)',
                    borderColor: 'rgba(75,192,192,1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(75,192,192,0.4)',
                    hoverBorderColor: 'rgba(75,192,192,1)'
                }]
            });


            setSpellingCheckResult(correctedTextAccumulator);
            setView('result');
        } catch (error) {
            setView('write');
        }
    };

    const handleQuestionChange = (index, value) => {
        const newQuestions = [...questions];
        newQuestions[index] = value;
        setQuestions(newQuestions);
    };

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const addField = () => {
        if (questions.length < 5) {
            setQuestions([...questions, ""]);
            setAnswers([...answers, ""]);
        }
    };

    const removeField = () => {
        if (questions.length > 3) {
            setQuestions(questions.slice(0, -1));
            setAnswers(answers.slice(0, -1));
        }
    };

    const handleReset = () => {
        setQuestions(["", "", ""]);
        setAnswers(["", "", ""]);
    };

    const openTitleDialog = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/get-titles?userEmail=${userEmail}`);
            setTitlesList(response.data);
            setOpenDialog(true);
        } catch (error) {
            console.error("Error loading titles:", error);
        }
    };

    const loadSelectedIntroduceContent = async (selectedTitle) => {
        try {
            const response = await axios.get(`http://localhost:8080/get-content-by-title?userEmail=${userEmail}&title=${selectedTitle}`);
            const data = response.data;
            if (data && data.introContent) {
                const loadedContent = JSON.parse(data.introContent);
                const loadedQuestions = loadedContent.map(item => item.question);
                const loadedAnswers = loadedContent.map(item => item.answer);
                setQuestions(loadedQuestions);
                setAnswers(loadedAnswers);
                setOpenDialog(false);
            }
        } catch (error) {
            console.error("Error loading introduce content:", error);
        }
    };

    const fetchUserName = async () => {
        try {
            const response = await axios.get('/api/auth/currentUserName', {
                headers: {
                    Authorization: `Bearer ${cookies.token}`
                }
            });
            setUserName(response.data.name);
        } catch (error) {
            console.error("Error fetching user name:", error);
        }
    };

    useEffect(() => {
        fetchUserEmail();
        fetchUserName();
    }, [cookies.token]);


    const chartOptions = {
        scales: {
            x: {
                type: 'category'
            },
            y: {
                type: 'linear',
                min: 0,
                max: 2000,
                ticks: {
                    stepSize: 400
                }
            }
        },
        maintainAspectRatio: false
    };

    const isFormValid = () => {
        return questions.every(q => q.trim() !== "") && answers.every(a => a.trim() !== "");
    };

    const textLines = (typeof result === "string") ? result.split('\n').length : 1;

    return (
        <Container maxWidth="md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px' }}>
            {view === 'start' && (
                <div align="center"
                     style={{backgroundImage: `url(${analysisImage})`,
                         backgroundPosition: 'center',
                         backgroundSize: 'cover',
                         backgroundRepeat: 'no-repeat',
                         width: '100vw',
                         height: '100vh',
                         marginTop:"-5%"}}>
                    <Container
                        maxWidth="sm"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '80vh',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '10px',
                            marginTop:"2.2%",
                            marginLeft:"36%",
                            boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)' // 그림자 효과
                        }}
                    >
                        <Typography variant="h5" style={{ marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                            자소서 분석
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '10px', color: '#333' }}>
                            여러분이 입력한 자소서를 기반으로 분석해주는 메뉴입니다.
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                            <br /><br />
                            ⟪ 자기소개서 분석 항목 ⟫
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                            수많은 합격 자기소개서 데이터를 통한 표절 검사
                            <br /><br />
                            자기소개서의 문법 오류를 알 수 있는 맞춤법 검사
                            <br /><br />
                            자기소개서에 쓰인 키워드를 통한 성향, 역량 검사
                            <br /><br />
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', textAlign: 'center' }}>
                            자기소개서 분석 검사를 통해
                            <br />
                            자신의 자기소개서의 문제점을 쉽게 파악할 수 있고
                            <br />
                            수정 및 삭제할 단어, 문장을 찾을 수 있습니다.
                            <br /><br />
                        </Typography>
                        <Button variant="contained" color="primary" onClick={handleStartAnalysis}>
                            자소서 분석하러가기
                        </Button>
                    </Container>
                </div>
            )}

            {view === 'loading' && (
                <Loading />
            )}

            {view === 'write' && (
                <>
                    <Box display="flex" flexDirection="row" width="100%" justifyContent="center" position="relative">
                        <Typography variant="h4" style={{ marginBottom: '10px', color: '#333', fontWeight: 600 }}>자소서 작성</Typography>
                        <Button variant="contained" onClick={openTitleDialog} style={{ position: 'absolute', right: 0, top: 0 }}>
                            자소서 불러오기
                        </Button>
                    </Box>
                    <Typography variant="h6" style={{ marginBottom: '20px', color: '#333' }}>
                        분석할 자기소개서를 입력해주세요!
                    </Typography>
                    <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                        <DialogTitle>자소서 선택</DialogTitle>
                        <List>
                            {titlesList.map((title, index) => (
                                <ListItem key={index} button onClick={() => loadSelectedIntroduceContent(title)}>
                                    <ListItemText primary={title} />
                                </ListItem>
                            ))}
                        </List>
                    </Dialog>

                    {questions.map((question, index) => (
                        <Box key={index} mt={2} width="100%">
                            <TextField
                                fullWidth
                                label={`문제 ${index + 1}`}
                                variant="outlined"
                                value={question}
                                onChange={(e) => handleQuestionChange(index, e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label={`내용 작성`}
                                variant="outlined"
                                multiline
                                rows={15}
                                value={answers[index]}
                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                style={{ marginTop: '10px' }}
                            />
                        </Box>
                    ))}

                    <Box mt={2} display="flex" justifyContent="center">
                        <IconButton onClick={addField} disabled={questions.length >= 5}>
                            <AddIcon />
                        </IconButton>
                        <IconButton onClick={removeField} disabled={questions.length <= 3}>
                            <RemoveIcon />
                        </IconButton>
                    </Box>

                    <Box mt={2} display="flex" justifyContent="center">
                        <Button variant="contained" color="secondary" onClick={handleReset}>
                            내용 초기화
                        </Button>
                    </Box>

                    <Box mt={3} mb={5} width="100%" display="flex" justifyContent="center">
                        <Button variant="contained" color="primary" onClick={handleCheck} disabled={!isFormValid()}>
                            분석 결과 확인
                        </Button>
                    </Box>
                </>
            )}

            {view === 'result' && (
                <Container maxWidth="md">
                    <Paper elevation={3} style={{ padding: '20px', borderRadius: '10px' }}>
                        <Typography variant="h5" gutterBottom style={{ color: '#333', fontWeight: 600 }}>분석 결과</Typography>
                        <Typography variant="h6" gutterBottom>{userName}님의 자기소개서 분석 결과입니다. </Typography>

                        <Typography variant="h6" style={{ color: '#333', fontWeight: 600 }}>
                            <br />
                            ⟪ 표절 검사 ⟫
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', fontWeight: 500 }}>
                            약 1300개의 합격 자기소개서와 비교하여 표절여부를 검사합니다.
                        </Typography>

                        <Box mb={3}>
                            <Typography variant="h6">합격 자소서와 유사도가 {result.similarity.toFixed(2)}%로</Typography>
                            <Typography variant="h6">표절 여부 {result.isPlagiarized ? "검사 결과 표절로 판별되었습니다. " : "검사 결과 표절이 아닙니다. "}</Typography>
                        </Box>

                        <Box mt={3} mb={3}>
                            <Typography variant="h6" style={{ color: '#333', fontWeight: 600 }}>
                                <br />
                                ⟪ 맞춤법 검사 ⟫
                            </Typography>
                            <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', fontWeight: 500 }}>
                                자기소개서의 맞춤법 및 오타를 검사합니다.
                            </Typography>

                            {spellingCheckResult.map((result, index) => (
                                <Box mt={2} key={index}>
                                    <Typography variant="h7">⟦ 문제 {index + 1} 결과 ⟧</Typography>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        value={result}
                                        rows={textLines}
                                        multiline
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                </Box>
                            ))}
                        </Box>

                        <Typography variant="h6" style={{ color: '#333', fontWeight: 600 }}>
                            <br />
                            ⟪ 역량 검사 ⟫
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', fontWeight: 500 }}>
                            자기소개서의 키워드를 통해 역량 검사를 진행합니다.
                        </Typography>
                        <Box mt={3} mb={4} width="100%" style={{ height: '400px', maxWidth: '800px' }}>
                            <Bar
                                ref={chartRef}
                                data={chartData}
                                options={chartOptions}
                                onElementsClick={(elements) => {
                                    if (elements.length > 0) {
                                        const chart = chartRef.current.chartInstance;
                                        setChartInstance(chart);
                                    }
                                }}
                            />
                        </Box>

                        <Typography variant="h7" style={{ marginTop: '40px', marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                            ※본 자기소개서 분석결과는 저장되지 않습니다.
                            <br />
                            ※필요시 화면 캡쳐 부탁드립니다.
                        </Typography>
                    </Paper>
                </Container>
            )}
        </Container>
    );
}

export default Analysis;