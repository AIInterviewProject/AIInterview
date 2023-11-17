import React, { useEffect, useState, useRef } from "react";
import {
    Button,
    Container,
    Typography,
    Box,
    DialogTitle,
    ListItemText,
    List,
    DialogContent,
    Paper,
    Divider,
    ListItem, Dialog, DialogActions, Stack
} from '@mui/material';
import { useCookies } from "react-cookie";
import axios from "axios";
import ChatQuestion from "../../components/ChatQuestion";
import interviewImage from '../../assets/images/interview_bg.gif';
import LoadingInterview from "../../components/LoadingInterview";
import QuestionCheck from "../../components/QuestionCheck";
import LoadingAnalyze from "../../components/LoadingAnalyze";
import interviewer from "../../assets/video/interviewer.mp4";

const TextToSpeech = ({ textToRead }) => {
    const playTextToSpeech = () => {
        const utterance = new SpeechSynthesisUtterance(textToRead);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <Button variant="contained" size="small" onClick={playTextToSpeech}>
            문제 읽기
        </Button>
    );
};

export default function Interview() {
    const [userEmail, setUserEmail] = useState('');
    const [cookies] = useCookies(['token']);
    const [loadedContent, setLoadedContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [interviewInProgress, setInterviewInProgress] = useState(false);
    const [gptResponse, setGptResponse] = useState(''); // GPT 응답을 저장할 상태
    const [gptResult, setGptResult] = useState('');
    const [showImage, setShowImage] = useState(false);
    const [problems, setProblems] = useState([]); // 문제 목록 상태 추가
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [speechRecognition, setSpeechRecognition] = useState(null);
    const [recognizedText, setRecognizedText] = useState('');
    const [listening, setListening] = useState(false);
    const [recordedText, setRecordedText] = useState([]); // 음성 인식 결과를 저장할 배열 추가
    const [interviewCompleted, setInterviewCompleted] = useState(false); // 면접 완료 여부를 추적하는 상태 추가
    const [interviewResult, setInterviewResult] = useState('');

    const videoRef = useRef(null);
    const [openSelectDialog, setOpenSelectDialog] = useState(false);
    const [titlesList, setTitlesList] = useState([]);
    const [selectedIntro, setSelectedIntro] = useState(null);
    const [step, setStep] = useState(1);
    const [gptResponsesReceived, setGptResponsesReceived] = useState(0);
    const [showStartScreen, setShowStartScreen] = useState(true);
    const [activeTab, setActiveTab] = useState('interviewRecord'); // 'interviewRecord' 또는 'answerAnalysis'

    const handleInterviewRecordClick = () => {
        setActiveTab('interviewRecord');
    };

    const handleAnswerAnalysisClick = () => {
        setActiveTab('answerAnalysis');
    };

    const handleStartButtonClick = () => {
        setShowStartScreen(false); // 시작 화면을 숨김
    };

    const openTitleDialog = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/get-titles?userEmail=${userEmail}`);
            setTitlesList(response.data);
            setOpenSelectDialog(true);
        } catch (error) {
            console.error("Error loading titles:", error);
        }
    };

    const selectIntroduceContent = async (selectedTitle) => {
        try {
            const response = await axios.get(`http://localhost:8080/get-content-by-title?userEmail=${userEmail}&title=${selectedTitle}`);
            const data = response.data;

            if (data && data.introContent) {
                setSelectedIntro(JSON.parse(data.introContent));
                setOpenSelectDialog(false);
            }
        } catch (error) {
            console.error("Error loading introduce content:", error);
        }
        setStep(2);
    };

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("웹캠을 시작하는 중에 오류가 발생했습니다: ", error);
        }
    };

    // GPT 응답을 처리하는 함수
    const handleGptResponse = (response) => {
        setGptResponse(response);
        setProblems(extractProblems(response));
        setGptResponsesReceived(prevCount => prevCount + 1); // GPT 응답 횟수 증가

        if (gptResponsesReceived === 1) { // 두 번째 응답을 받았을 때만 화면 전환
            setStep(3);
        }
    };

    const handleGptResult = (response) => {
        setGptResult(response);
        setGptResponsesReceived(prevCount => prevCount + 1); // GPT 응답 횟수 증가

        if (gptResponsesReceived === 1) {
            setGptResponsesReceived(0);
        }
    };

    const extractProblems = (text) => {
        const problemRegex = /\d+\.\s(.*?)(?=\d+\.\s|$)/gs;
        const matches = text.match(problemRegex);

        if (matches) {
            const problems = matches.map((match, index) => {
                return {
                    number: index + 1,
                    content: match.trim(),
                };
            });
            return problems;
        } else {
            return [];
        }
    };

    useEffect(() => {
        // SpeechRecognition 초기화
        const recognition = new window.webkitSpeechRecognition || new window.SpeechRecognition();
        recognition.lang = "ko-KR"; // 한국어로 설정
        recognition.continuous = true; // 연속 음성 인식 활성화
        recognition.interimResults = true; // 중간 결과 표시

        recognition.onstart = () => {
            setRecognizedText(''); // 초기화 인식 텍스트
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            setRecognizedText(finalTranscript);
        };

        setSpeechRecognition(recognition);
    }, []);

    const startListening = () => {
        if (speechRecognition) {
            speechRecognition.start();
            setListening(true);
        }
    };

    const stopListening = () => {
        if (speechRecognition) {
            speechRecognition.stop();
            setListening(false);
        }
    };

    const saveRecordedText = async () => {
        if (recognizedText.trim() !== "") {
            setRecordedText([...recordedText, recognizedText]);
            setRecognizedText("");
        }
    };


    const handleInterviewCompletion = () => {
        setInterviewCompleted(true);
        setInterviewInProgress(false);
        setCurrentProblemIndex(0);

        // 면접 답변을 하나의 텍스트로 합칩니다.
        const interviewResponses = problems.map((problem, index) => {
            const question = `질문 ${problem.number}: ${problem.content}`;
            const answer = recordedText[index] || '대답 없음'; // 대답이 없을 경우 대신 '대답 없음'으로 표시
            return `${question}\n${answer}`;
        });

        // 면접 답변을 하나의 텍스트로 합친 결과를 저장합니다.
        const interviewResponsesText = interviewResponses.join('\n\n');
        setInterviewResult(interviewResponsesText);
    };

    useEffect(() => {
        const fetchUserEmail = async () => {
            setIsLoading(true);
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
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchUserEmail();
    }, [cookies.token]);

    useEffect(() => {
        const loadIntroduceContent = async () => {
            if (userEmail) {
                try {
                    const response = await axios.get(`http://localhost:8080/get-content?userEmail=${userEmail}`);
                    const data = response.data;

                    if (data && data.introContent) {
                        setLoadedContent(JSON.parse(data.introContent));
                    }
                } catch (error) {
                    console.error("Error loading introduce content:", error);
                }
            }
        };

        loadIntroduceContent();
    }, [userEmail]);

    const startInterview = () => {
        setStep(3);
        if (problems.length > 0) {
            setRecordedText([]); // 녹음된 텍스트 초기화
            setInterviewCompleted(false);
            setInterviewInProgress(true);
            setShowImage(true);
            setCurrentProblemIndex(0);
            startWebcam(); // 면접 시작 시 웹캠을 실행합니다.
        }
    };

    const nextProblem = () => {
        if (currentProblemIndex < problems.length - 1) {
            setCurrentProblemIndex(currentProblemIndex + 1);
        } else {
            // 모든 문제가 표시된 경우에 대한 처리를 추가
        }
    };

    const goToStartScreen = () => {
        setShowStartScreen(true);
    };

    const goBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    return (
        <Container maxWidth="md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px' }}>
            {showStartScreen ? (
                <div align="center"
                     style={{backgroundImage: `url(${interviewImage})`,
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
                            marginLeft:"37%",
                            boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)' // 그림자 효과
                        }}
                    >
                        <Typography variant="h5" style={{ marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                            모의면접
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '10px', color: '#333' }}>
                            입력한 자소서를 기반으로 모의면접을 할 수 있는 메뉴입니다.
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                            <br /><br />
                            ⟪ 모의 면접 소개 ⟫
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                            입력한 자기소개서를 통해
                            <br /><br />
                            예상 면접 질문을 분석 • 추출하여
                            <br /><br />
                            가상의 면접관과 면접을 진행합니다.
                            <br /><br />
                        </Typography>
                        <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', textAlign: 'center' }}>
                            모의 면접 시스템을 통해
                            <br />
                            각 회사의 예상 질문을 알 수 있고
                            <br />
                            대답에 대한 보완점을 찾을 수 있는 등
                            <br />
                            각 면접에 대한 대비를 할 수 있습니다.
                            <br />
                            <br />
                        </Typography>

                        <Button variant="contained" color="primary" onClick={handleStartButtonClick}>
                            모의면접 하러가기
                        </Button>
                    </Container>
                </div>
            ) : (
                <>
                    {step === 1 && (
                        <Container
                            maxWidth="sm"
                            style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '60vh',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '10px',
                                marginTop:"10%",
                                boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)' // 그림자 효과
                            }}
                        >
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button
                                    onClick={goToStartScreen}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        zIndex: 10
                                    }}
                                >
                                    이전
                                </Button>
                                <Typography variant="h5" style={{ marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                                    Step1. 자기소개서 제출
                                </Typography>
                            </div>
                            <Typography variant="h6" style={{ color: '#333', alignItems: 'center' }}>
                                입력한 자기소개서를 키워드를 분석하여
                                <br /><br />
                            </Typography>
                            <Typography variant="h6" style={{ color: '#333', alignItems: 'center' }}>
                                예상 면접 질문을 추출하고
                                <br /><br />
                            </Typography>
                            <Typography variant="h6" style={{ marginBottom: '20px', color: '#333', alignItems: 'center' }}>
                                가상의 면접관과 면접을 진행합니다.
                                <br /><br />
                            </Typography>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <Button variant="contained" color="primary" onClick={openTitleDialog}>
                                    자소서 선택하기
                                </Button>
                            </div>
                            <Dialog open={openSelectDialog} onClose={() => setOpenSelectDialog(false)}>
                                <DialogTitle style={{ textAlign: 'center' }}>자소서 선택</DialogTitle>
                                <DialogContent>
                                    <List>
                                        {titlesList.map((title, index) => (
                                            <ListItem button key={index} onClick={() => selectIntroduceContent(title)}>
                                                <ListItemText primary={title} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </DialogContent>
                                <DialogActions style={{ justifyContent: 'center' }}>
                                    <Button onClick={() => setOpenSelectDialog(false)} color="primary">
                                        취소
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Container>
                    )}

                    {step === 2 && (
                        <>
                            <Container
                                maxWidth="sm"
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '60vh',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '10px',
                                    marginTop:"10%",
                                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)' // 그림자 효과
                                }}
                            >
                                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button
                                        onClick={goBack}
                                        style={{
                                            position: 'absolute',
                                            top: '10px',
                                            left: '10px',
                                            zIndex: 10
                                        }}
                                    >
                                        이전
                                    </Button>
                                    <Typography variant="h5" style={{ color: '#333', fontWeight: 600 }}>
                                        Step2. 질문 추출
                                    </Typography>
                                </div>
                                <div style={{ display: 'none' }}>
                                    <ChatQuestion introContent={selectedIntro} onGptResponse={handleGptResponse} />
                                </div>
                                {gptResponse ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography variant="h6" style={{ marginTop: '20px', color: '#333' }}>
                                            이제 당신 차례입니다 !
                                            <br /><br />
                                        </Typography>
                                        <Typography variant="h6" style={{ color: '#333' }}>
                                            자신감을 가지고
                                            <br /><br />
                                        </Typography>
                                        <Typography variant="h6" style={{ marginBottom: '20px', color: '#333' }}>
                                            면접관이 하는 질문에 대답해주세요 !
                                            <br /><br />
                                        </Typography>
                                        <Button variant="contained" color="primary" onClick={startInterview}>
                                            면접 시작
                                        </Button>
                                    </div>
                                ) : (
                                    <LoadingInterview />
                                )}
                            </Container>
                        </>
                    )}

                    {step === 3 && (
                        <div>
                            {interviewInProgress ? (
                                <div>
                                    <div style={{ textAlign: 'center', width: '100%' }}>
                                        <Typography variant="h5" align="center" style={{ color: '#333', fontWeight: 600 }}>
                                            면접
                                        </Typography>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <Typography variant="h6" align="center" style={{ marginTop: '5px', marginRight: '15px', color: '#333' }}>
                                                면접 질문 : {problems[currentProblemIndex].content}
                                            </Typography>
                                            <TextToSpeech textToRead={problems[currentProblemIndex].content} />
                                        </div>
                                        <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                            <div style={{ flex: 1 }}>
                                                <video muted autoPlay playsInline loop ref={videoRef} style={{ width: '500px', height: '500px', marginTop: '5px', marginRight: '20px' }}><source src={interviewer} type="video/mp4" /></video>
                                            </div>
                                            <div style={{ flex: 1, height: '500px' }}>
                                                <video ref={videoRef} autoPlay playsInline style={{ height: '100%', width: 'auto' }}></video>
                                            </div>
                                        </div>
                                        <div>
                                            <Button variant="contained" color="success" onClick={startListening} disabled={listening} style={{ marginRight: '10px'}}>
                                                대답 하기
                                            </Button>
                                            <Button variant="contained" color="error" onClick={stopListening} disabled={!listening} style={{ marginRight: '10px' }}>
                                                대답 끝
                                            </Button>
                                            <Button variant="outlined" onClick={saveRecordedText}>대답 저장</Button>
                                        </div>
                                        <div>
                                            <p>{recognizedText}</p>
                                        </div>
                                        <Button variant="contained" color="primary" style={{ marginRight: '15px' }} onClick={nextProblem} disabled={currentProblemIndex >= problems.length - 1}>
                                            다음 문제
                                        </Button>
                                        <Button variant="contained" color="secondary" onClick={handleInterviewCompletion}>
                                            면접 종료
                                        </Button>
                                    </div>
                                </div>
                            ) : null}

                            {interviewCompleted && (
                                <div style={{ display: 'none' }}>
                                    <QuestionCheck introContent={interviewResult} onGptResponse={handleGptResult} />
                                </div>
                            )}

                            {gptResult ? (
                                <Container maxWidth="md" style={{ marginTop: '10px' }}>
                                    <Stack direction="row">
                                        <Button
                                            variant={activeTab === 'interviewRecord' ? 'contained' : 'outlined'}
                                            onClick={handleInterviewRecordClick}
                                        >
                                            면접 기록
                                        </Button>
                                        <Button
                                            variant={activeTab === 'answerAnalysis' ? 'contained' : 'outlined'}
                                            onClick={handleAnswerAnalysisClick}
                                        >
                                            대답 분석
                                        </Button>
                                    </Stack>

                                    {activeTab === 'interviewRecord' ? (
                                        <Paper elevation={3} style={{ padding: '30px', marginBottom: '30px' }}>
                                            <Typography variant="h4" align="center" gutterBottom>
                                                면접 완료
                                            </Typography>
                                            <Divider style={{ margin: '20px 0' }} />
                                            <Typography variant="h6" gutterBottom style={{ color: '#333', fontWeight: 'bold' }}>
                                                면접 기록
                                            </Typography>
                                            <List>
                                                {problems.map((problem, index) => (
                                                    <div key={`interview-set-${index}`}>
                                                        <ListItem>
                                                            <ListItemText primary={`질문${problem.content}`} />
                                                        </ListItem>
                                                        {recordedText[index] && (
                                                            <ListItem>
                                                                <ListItemText primary={`대답: ${recordedText[index]}`} />
                                                            </ListItem>
                                                        )}
                                                    </div>
                                                ))}
                                            </List>
                                            <Typography variant="h7" style={{ marginTop: '100px', marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                                                ※본 면접 기록은 저장되지 않습니다.
                                                <br />
                                                ※필요시 화면 캡쳐 부탁드립니다.
                                            </Typography>
                                        </Paper>
                                    ) : (
                                        <Paper elevation={3} style={{ padding: '30px', marginBottom: '30px' }}>
                                            <Typography variant="h4" align="center" gutterBottom>
                                                면접 완료
                                            </Typography>
                                            <Divider style={{ margin: '20px 0' }} />
                                            <Typography variant="h6" gutterBottom style={{ color: '#333', fontWeight: 'bold' }}>
                                                대답 분석
                                            </Typography>
                                            <Typography variant="h7" style={{ marginTop: '100px', marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                                                ※대답한 질문에 대해서 분석이 진행됩니다.
                                                <br />
                                            </Typography>
                                            <List>
                                                {problems.map((problem, index) => (
                                                    recordedText[index] ? (
                                                        <div key={`interview-set-${index}`}>
                                                            <ListItem>
                                                                <ListItemText primary={`질문${problem.content}`} />
                                                            </ListItem>
                                                            <ListItem>
                                                                <ListItemText primary={`대답: ${recordedText[index]}`} />
                                                            </ListItem>
                                                        </div>
                                                    ) : null
                                                ))}
                                            </List>
                                            <Typography variant="h6" style={{ marginTop: '30px', color: '#333', fontWeight: 700 }}>
                                                ⟦종합 분석 결과⟧
                                            </Typography>
                                            <Box padding="20px" border="1px solid #666" borderRadius="10px" backgroundColor="#f5f5f5">
                                                <Typography variant="h6" style={{ color: '#444', fontWeight: 500 }}>
                                                    {gptResult}
                                                </Typography>
                                            </Box>
                                            <Box marginTop="35px">
                                                <Typography variant="h7" style={{ marginBottom: '20px', color: '#333', fontWeight: 600 }}>
                                                    ※본 분석 기록은 저장되지 않습니다.
                                                    <br />
                                                    ※필요시 화면 캡쳐 부탁드립니다.
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    )}
                                </Container>
                            ) : (
                                <LoadingAnalyze/>
                            )}
                        </div>
                    )}
                </>
            )}
        </Container>
    );
}