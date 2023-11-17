import React, {useState} from "react";
import {Box, Button, Card, TextField} from "@mui/material";
import axios from "axios";
import {useCookies} from "react-cookie";
import {useUserStore} from "../../../stores";
import Typography from "@mui/material/Typography";
import {signInApi} from "../../../apis";

export default function SignIn({setAuthView}){
    const Purple4th = '#999aae';
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');

    const [cookies, setCookies] = useCookies();
    const {user, setUser} = useUserStore();
    const signInHandler = async () =>{
        if(userEmail.length === 0 || userPassword.length === 0){
            alert('이메일과 비밀번호를 입력하세요. ');
            return;
        }

        const data = {
            userEmail,
            userPassword
        }

        const signInResponse = await signInApi(data);
        if(!signInResponse){
            alert('이메일 또는 비밀번호가 일치하지 않습니다');
            return;
        }

        if(!signInResponse.result){
            alert('이메일 또는 비밀번호가 일치하지 않습니다');
            return;
        }
        const {token, exprTime, user} = signInResponse.data;
        const expires = new Date();
        expires.setMilliseconds(expires.getMilliseconds() + exprTime);
        setCookies('token', token, {expires});
        setUser(user);
    }
    return(
        <container style={{
            position: 'absolute', top: "0%",
            left: "0%", width: "100%", height: "100%", backgroundColor: Purple4th
        }}>
            <div style={{position: 'relative'}}>
                <div>
                    <img alt="loginBackground" src="/img/img/signINPage.png" width="100%"/>
                </div>
                <div>
                    <label>
                        <Box display="flex" alignItems="center" >
                            <TextField
                                fullWidth sx={{ width: '20%' }}
                                label="이메일"
                                type="email"
                                variant="standard"
                                onChange={(e) => setUserEmail(e.target.value)}
                                style={{
                                    fontSize: '1.9vw',
                                    position: 'absolute',
                                    top: "48%",
                                    left: "38%",
                                    transform: "translate(-50%, -60%)"
                                }}
                            />
                            <TextField
                                fullWidth sx={{ width: '20%' }}
                                label="비밀번호"
                                type="password"
                                variant="standard"
                                onChange={(e) => setUserPassword(e.target.value)}
                                style={{
                                    fontSize: '1.9vw',
                                    position: 'absolute',
                                    top: "55%",
                                    left: "38%",
                                    transform: "translate(-50%, -60%)"
                                }}
                            />
                        </Box>
                    </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: "55.4%", left: "65.88%", transform: "translate(-50%, -50%)" }}>
                    <Typography variant="h5" component="div" color="white" style={{ textAlign: 'center',  fontWeight: 550}}>
                        당신의 면접을 확실하게 준비해줄
                        <br />
                        AI 프로젝트
                        <br />
                        Be With You에 가입하세요!
                    </Typography>
                </div>
                <img alt="loginBackground" src="/img/img/LoginSignINBtn.png" width="10%" onClick={() => signInHandler()} style={{
                    position: 'absolute', top: "70.1%",
                    left: "39.2%", transform: "translate( -70.1%, -39.2%)"
                }}/>
                <img alt="loginBackground" src="/img/img/LoginSignUpBtn.png" width="10%" onClick={() => setAuthView(true)} style={{
                    position: 'absolute', top: "70.9%",
                    left: "66.88%", transform: "translate( -70.1%, -66.88%)"
                }}/>
            </div>
        </container>
    )
}