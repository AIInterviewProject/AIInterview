import React, {useState} from "react";
import "./style.css";
import selfIntroData from "./self_intro_data.json";
import searchImage from '../../assets/images/search.png';

//MayThe4th
export default function CompanyIntro(){
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedContent, setSelectedContent] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState(selfIntroData);

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleSearch = () => {
        const result = selfIntroData.filter(item =>
            item.title.includes(searchTerm)
        );
        setFilteredData(result);
        setCurrentPage(1);
    };

    return (
        <div className="company-intro-container">
            <div className="header-container">
                <Header />
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearch={handleSearch} />
            </div>
            <div className="search-result-count">
                전체 <span className="highlighted-count">{filteredData.length}</span>개 항목
            </div>
            <div className="titles-container">
                <div className="titles-container2">
                    <Titles
                        data={filteredData}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        setSelectedContent={setSelectedContent}
                    />
                </div>
                <Content content={selectedContent} />
            </div>
            <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
        </div>
    );
}

function Titles({ data, itemsPerPage, currentPage, setSelectedContent }) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = data.slice(startIndex, endIndex);

    return (
        <div className="titles">
            {currentData.map((item, index) => (
                <div
                    key={index}
                    className="title"
                    onClick={() => setSelectedContent(item.content)}
                >
                    <h4>{item.title}</h4>
                </div>
            ))}
        </div>
    );
}

function splitByNumberedPattern(content) {
    const pattern = /(?<!\d-)(\d+\.)|(\d+\))/g;  // 숫자-숫자. 패턴을 피하기 위한 lookbehind assertion과 숫자) 패턴 추가
    return content.split(pattern);
}

function Content({ content }) {
    if (!content) return null;
    const contentParts = splitByNumberedPattern(content);

    return (
        <div className="content">
            {contentParts.map((part, index) => {
                if (index % 2 === 1) {
                    return <span key={index}>{part}</span>;
                }
                return <div key={index}>{part}</div>;
            })}
        </div>
    );
}

function Pagination({ totalPages, currentPage, setCurrentPage }) {
    const maxPageNumbersToShow = 10;

    // 페이지 번호 계산
    let startPage = Math.floor((currentPage - 1) / maxPageNumbersToShow) * maxPageNumbersToShow + 1;
    let endPage = startPage + maxPageNumbersToShow - 1;
    if (endPage > totalPages) {
        endPage = totalPages;
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination">
            <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
            >
                {"<<"}
            </button>
            <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
            >
                {"<"}
            </button>
            {pageNumbers.map(number => (
                <button
                    key={number}
                    className={currentPage === number ? "active-page" : ""}
                    onClick={() => setCurrentPage(number)}
                >
                    {number}
                </button>
            ))}
            <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                {">"}
            </button>
            <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
            >
                {">>"}
            </button>
        </div>
    );
}


function Header() {
    return (
        <div className="header">
            <h1 align='CENTER'>합격을 만드는 기업별 자소서</h1>
            <h3 align='CENTER'>원하는 기업의 자소서를 미리 확인하고 합격의 기회를 잡으세요.</h3>
        </div>
    );
}

function SearchBar({ searchTerm, setSearchTerm, handleSearch }) {
    return (
        <div className="search-bar" align="CENTER">
            <input
                type="text"
                placeholder="기업명 입력"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <button onClick={handleSearch}>검색</button>
        </div>
    );
}