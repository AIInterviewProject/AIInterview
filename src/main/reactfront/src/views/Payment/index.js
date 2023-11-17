import React, { useEffect, useState } from "react";
import axios from 'axios';
import BootPay from "bootpay-js";
import {Button} from "@mui/material";
import {useCookies} from "react-cookie";
import { useNavigate } from 'react-router-dom';
import {PricingTable, PricingSlot, PricingDetail} from "react-pricing-table";
import Loading from "../../components/Loading";
import PageLoading from "../../components/PageLoading";

export default function Payment(){
    const [userEmail, setUserEmail] = useState('');
    const [cookies] = useCookies(['token']);
    const [remainingDays, setRemainingDays] = useState(0);
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserEmail = async () => {
            const token = cookies.token;

            if (token) {
                try {
                    const userDetails = await axios.get('/api/auth/currentUser', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    const fetchedUserEmail = userDetails.data.userEmail;
                    setUserEmail(fetchedUserEmail);

                    updateRemainingDays(fetchedUserEmail);
                } catch (error) {
                    console.error("Error fetching user email:", error);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchUserEmail();
    }, [cookies.token]);

    const updateRemainingDays = (email) => {
        setLoading(true);
        axios.get(`/api/get-days?userEmail=${email}`)
            .then(response => {
                setRemainingDays(response.data);

                const end = new Date();
                end.setDate(end.getDate() + response.data);
                setEndDate(end);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching remaining days:", error);
                setLoading(false);
            });
    };

    const onPayment = (duration) => {
        const productName = `프리미엄 ${duration}일 이용권`;

        // 가격 동적 할당
        let price;
        switch (duration) {
            case 30:
                price = '100';
                break;
            case 90:
                price = '200';
                break;
            case 180:
                price = '300';
                break;
            default:
                alert("선택한 이용 기간이 잘못되었습니다.");
                return;
        }

        BootPay.request({
            price: price,
            application_id: "651fdab0d25985001abb83d6",
            name: productName,
            pg: 'inicis',
            method: 'card', //결제수단, 입력하지 않으면 결제수단 선택부터 화면이 시작합니다.
            show_agree_window: 0, // 부트페이 정보 동의 창 보이기 여부
            order_id: `premium${duration}`, //고유 주문번호로, 생성하신 값을 보내주셔야 합니다.
        }).error(function (data) {
            alert("결제가 취소되었습니다")
        }).cancel(function (data) {
            alert("결제가 취소되었습니다")
        }).ready(function (data) {
        }).confirm(function (data) {
            var enable = true; // 재고 수량 관리 로직 혹은 다른 처리
            if (enable) {
                BootPay.transactionConfirm(data); // 조건이 맞으면 승인 처리를 한다.
            } else {
                BootPay.removePaymentWindow(); // 조건이 맞지 않으면 결제 창을 닫고 결제를 승인하지 않는다.
            }
        }).close(function (data) {
        }).done(function (data) {
            alert("결제가 완료되었습니다");
            document.dispatchEvent(new Event('paymentSuccess'));

            axios.post('/api/save-payment', {
                userEmail: userEmail,
                days: duration
            })
                .then(response => {
                    updateRemainingDays();
                    navigate('/');
                })
                .catch(error => {
                });
        });
    };

    const pricingData = [
        {
            title: "빠른 면접 대응",
            price: "₩30,000",
            details: [
                "✅ 30일 이용권",
            ],
            duration: 30
        },
        {
            title: "합리적 면접 준비",
            price: "₩77,700",
            details: [
                "✅ 90일 이용권",
            ],
            duration: 90
        },
        {
            title: "완벽 대비",
            price: "₩150,000",
            details: [
                "✅ 180일 이용권",
            ],
            duration: 180
        },
    ];


    return (
        <div>
            {loading ? (
                <PageLoading />
            ) : (
                <>
                    <div style={{backgroundImage:"url(/img/img/paymentBGImage.png)",
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        width: '100vw',
                        height: '100vh'}}>
                        <p align="center">
                            <br/><br/><br/>
                            <h2 style={{color:"#ffffff"}}> 당신과 함께, May The 4th는 성장 합니다 </h2>
                            <h4 style={{color:"#ffffff", marginTop:"-6px",marginBottom:"-2px"}}> 더 나은 정보 제공과 사용자의 만족을 위해 </h4>
                            <h4 style={{color:"#ffffff", marginTop:"-2px"}}> Be With You 프리미엄 서비스가 시작되었습니다. </h4>
                            <h5 style={{color:"#1c1c1c", marginBottom:"-2px"}}> 남은 이용일 수 : {remainingDays}일 </h5>
                            <h5 style={{color:"#1c1c1c", marginTop:"-2px"}}>{remainingDays > 0 ? `이용 만료 예정일: ${endDate.toLocaleDateString()}` : "이용권이 없습니다"}</h5>
                            <h5 style={{color:"#1c1c1c", marginTop:"-3px"}}> 프리미엄 서비스 이용시 누릴 수 있는 혜택
                                <br/><br/>
                                가상 면접관과 함께하는 모의 면접,
                                <br/>
                                예상 질문을 통한 예시 대답 챗봇</h5>
                            <br/>
                        </p>
                        <PricingTable highlightColor="#1976D2">
                            {pricingData.map((item, index) => (
                                <PricingSlot
                                    key={index}
                                    buttonText=" 프리미엄 서비스 시작 "
                                    title={item.title}
                                    priceText={item.price}
                                    onClick={() => onPayment(item.duration)} // 추가된 코드
                                >
                                    {item.details.map((detail, i) => (
                                        <PricingDetail key={i}>{detail}</PricingDetail>
                                    ))}
                                </PricingSlot>
                            ))}
                        </PricingTable>
                    </div>

                </>
            )}
        </div>
    );
}