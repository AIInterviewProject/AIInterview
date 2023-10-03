import React from "react";
import {Route, Routes} from "react-router-dom";
import ProjectMain from "./views/ProjectMain";
import ChatBot from "./views/ChatBot";
import Interview from "./views/Interview";
import Analysis from "./views/Analysis";
import Board from "./views/Board";
import Payment from "./views/Payment";
import MemberChange from "./views/MemberChange"

export default function Routing(){
    return (
        <div>
            <div style={{ marginTop: '90px' }}>
                <Routes>
                    <Route path='/' element={<ProjectMain/>} />
                    <Route path='/chatbot' element={<ChatBot/>} />
                    <Route path='/interview' element={<Interview />} />
                    <Route path='/analysis' element={<Analysis/>} />
                    <Route path='/board' element={<Board/>} />
                    <Route path='/payment' element={<Payment/>} />
                    <Route path='/memberInfo' element={<MemberChange/>} />
                </Routes>
            </div>
        </div>
    )
}