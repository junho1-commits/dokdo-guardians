# -*- coding: utf-8 -*-
import os
import pandas as pd
from pyhwpx import Hwp

def create_dokdo_plan():
    target_dir = os.path.abspath(r"D:\OneDrive - 모덕초등학교\앱 개발\자료개발 학습\독도\독도 행사 계획")
    output_path = os.path.join(target_dir, "10월25일_독도의날_행사계획서(6학년3반).hwpx")
    
    hwp = Hwp(visible=False)
    
    # 1. 문서 제목
    hwp.set_font(FaceName="맑은 고딕", Height=20, Bold=True, TextColor="Navy")
    hwp.ParagraphShapeAlignCenter()
    hwp.insert_text("10월 25일 독도의 날 기념 행사 계획서")
    hwp.BreakPara()
    
    # 소제목
    hwp.set_font(FaceName="맑은 고딕", Height=11, Bold=True, TextColor="Gray")
    hwp.ParagraphShapeAlignCenter()
    hwp.insert_text("- 6학년 3반과 함께하는 교내 독도 체험 한마당: 「독도야 놀자! 우리 땅 바로 알기」 -")
    hwp.BreakPara()
    hwp.BreakPara()
    
    def insert_section_title(title):
        hwp.set_font(FaceName="맑은 고딕", Height=13, Bold=True, TextColor="Black")
        hwp.ParagraphShapeAlignLeft()
        hwp.insert_text(title)
        hwp.BreakPara()
        
    def insert_body_text(text):
        hwp.set_font(FaceName="맑은 고딕", Height=10, Bold=False, TextColor="Black")
        hwp.ParagraphShapeAlignJustify()
        hwp.insert_text(text)
        hwp.BreakPara()

    # 1. 행사 개요
    insert_section_title("1. 행사 개요")
    df_overview = pd.DataFrame([
        {"구분": "행사명", "내용": "6학년 3반과 함께하는 10월 25일 「독도의 날」 교내 체험 한마당"},
        {"구분": "일시", "내용": "2026년 10월 25일(독도의 날)\n• 1차(중간 놀이시간): 10:20 ~ 10:50 (약 30분)\n• 2차(점심시간): 12:40 ~ 13:30 (약 50분)"},
        {"구분": "장소", "내용": "학교 중앙현관(로비) 및 6학년 복도 / 6학년 3반 교실"},
        {"구분": "주최 / 주관", "내용": "6학년 3반 학생 일동 (지도교사: 담임교사)"},
        {"구분": "참가 대상", "내용": "전교생 (1~6학년) 및 교직원"}
    ])
    hwp.table_from_data(df_overview, index=False, treat_as_char=True, cell_fill=(230, 240, 252), header_bold=True)
    hwp.set_col_width([22, 78])
    hwp.MoveDocEnd()
    hwp.BreakPara()

    # 2. 목적 및 방침
    insert_section_title("2. 목적 및 방침")
    insert_body_text("가. 목적")
    insert_body_text("  1) 1900년 10월 25일 대한제국 칙령 제41호 제정을 기념하는 독도의 날의 역사적 유래와 가치를 전교생에게 홍보한다.")
    insert_body_text("  2) 6학년 3반 학생들이 주도적으로 부스를 기획·운영하여 협동심과 학생 자치 실천 역량을 신장한다.")
    insert_body_text("  3) 디지털 미디어(Canva)와 가상 탐험 앱(3D/방탈출), 현장 참여형 퀴즈를 결합하여 전교생이 즐겁게 참여하도록 한다.")
    insert_body_text("나. 방침")
    insert_body_text("  1) 안전을 최우선으로 하여 이동 동선(일방통행)과 안전 도우미를 배치한다.")
    insert_body_text("  2) 중간 놀이시간에는 저학년(1~3학년) 맞춤형, 점심시간에는 고학년(4~6학년) 및 전교생 자율 참여로 분산 운영한다.")
    insert_body_text("  3) 6학년 3반 학생 20명 전원이 적성과 희망에 맞추어 역할을 분담하고 성실히 운영한다.")
    insert_body_text("  4) 스탬프 투어를 완료한 학생에게 독도 기념품을 제공하여 적극적인 참여를 유도한다.")
    hwp.BreakPara()

    # 3. 학생 조직 및 역할 분담
    insert_section_title("3. 학생 조직 및 역할 분담 (6학년 3반 총 20명)")
    df_teams = pd.DataFrame([
        {
            "팀 구분": "1. Canva 홍보팀\n(디자인·미디어)",
            "참여 학생 (20명)": "수은, 나연, 지우,\n세은, 윤정, 희경,\n예준 (7명)",
            "주요 역할 및 세부 담당 업무": "• 사전 홍보 포스터 디자인 및 각 층 게시판 부착\n• 독도 역사·자연 안내 카드뉴스 및 리플릿 제작\n• 모니터 송출용 독도 숏폼/홍보 영상 제작\n• 당일 행사 사진 및 영상 촬영, 활동 기록"
        },
        {
            "팀 구분": "2. 앱 체험팀\n(디지털·인터랙티브)",
            "참여 학생 (20명)": "승준, 도현, 수현,\n가빈, 보민 (5명)",
            "주요 역할 및 세부 담당 업무": "• 태블릿PC 세팅 (독도 3D 탐험 & 방탈출 웹앱 구동)\n• 저·고학년 수준별 맞춤형 조작법 안내 (1:1 도우미)\n• 가상 독도 퀘스트 성공 확인 및 스탬프 도장 날인\n• 전자기기 배터리 및 네트워크 상시 점검"
        },
        {
            "팀 구분": "3. 직접 진행팀\n(현장 진행·도슨트)",
            "참여 학생 (20명)": "건, 시원, 서희,\n지언, 태언, 지호,\n주원, 민수 (8명)",
            "주요 역할 및 세부 담당 업무": "• [독도 도슨트]: 독도의 역사 및 해양 생태 1분 해설\n• [팡팡 퀴즈존]: 독도 OX 퀴즈 및 스피드 퀴즈 진행\n• [독도 응원존]: 대형 독도 지도에 응원 포스트잇 부착 지도\n• [운영 본부]: 참가자 동선 안내, 질서 유지, 기념품 지급"
        }
    ])
    hwp.table_from_data(df_teams, index=False, treat_as_char=True, cell_fill=(230, 240, 252), header_bold=True)
    hwp.set_col_width([24, 26, 50])
    hwp.MoveDocEnd()
    hwp.BreakPara()

    # 4. 세부 부스 및 프로그램 구성
    insert_section_title("4. 세부 부스 및 프로그램 구성 (스탬프 투어)")
    df_booths = pd.DataFrame([
        {
            "부스 구분": "[부스 1]\n독도를 만나요",
            "영역 / 담당": "도슨트 & 미디어\n(Canva팀 + 진행팀)",
            "세부 운영 내용 및 미션": "• 대형 모니터 독도 홍보 영상 상시 상영\n• 6학년 학생 해설사의 1분 독도 이야기 해설 경청\n• 경청 완료 후 첫 번째 스탬프 날인"
        },
        {
            "부스 구분": "[부스 2]\n독도를 탐험해요",
            "영역 / 담당": "디지털 가상 체험\n(앱 체험팀)",
            "세부 운영 내용 및 미션": "• 태블릿으로 3D 독도 가상 탐험 및 방탈출 미션 수행\n• (저학년) 독도 섬 둘러보기 및 캐릭터 보물찾기\n• (고학년) 독도 역사 퀴즈 방탈출 미션 클리어\n• 미션 완료 화면 인증 후 두 번째 스탬프 날인"
        },
        {
            "부스 구분": "[부스 3]\n팡팡 독도 퀴즈",
            "영역 / 담당": "현장 참여 퀴즈\n(직접 진행팀)",
            "세부 운영 내용 및 미션": "• 수준별(초급/중급/고급) 독도 상식 OX 및 스피드 퀴즈\n• 힌트 카드를 활용하여 전원 정답 및 성공 유도\n• 퀴즈 통과 후 세 번째 스탬프 날인"
        },
        {
            "부스 구분": "[부스 4]\n독도 사랑 다짐",
            "영역 / 담당": "운영 본부 & 기념품\n(직접 진행팀 + Canva팀)",
            "세부 운영 내용 및 미션": "• 스탬프 3개를 모두 모은 학생 대상 기념품 수령\n• 대형 독도 지도에 '독도 응원 한마디' 포스트잇 부착\n• 독도의 날 기념 스티커 및 간식 배부\n• 독도 포토존 기념사진 촬영"
        }
    ])
    hwp.table_from_data(df_booths, index=False, treat_as_char=True, cell_fill=(230, 240, 252), header_bold=True)
    hwp.set_col_width([20, 26, 54])
    hwp.MoveDocEnd()
    hwp.BreakPara()

    # 5. 시간대별 진행 일정
    insert_section_title("5. 시간대별 진행 일정")
    df_schedule = pd.DataFrame([
        {
            "시간": "08:30 ~ 09:00\n(아침 자습)",
            "세부 진행 내용": "• 부스 설치, 기자재(태블릿, 모니터) 연결 및 점검\n• 팀별 최종 리허설 및 동선 확인",
            "담당 및 장소": "전원\n(중앙현관 및 6-3 교실)"
        },
        {
            "시간": "10:20 ~ 10:50\n(중간 놀이시간)",
            "세부 진행 내용": "• [1차 운영] 저학년(1~3학년) 중심 맞춤형 부스 운영\n• 쉬운 퀴즈 및 3D 독도 관람 위주 진행",
            "담당 및 장소": "전원\n(각 부스별 위치)"
        },
        {
            "시간": "10:50 ~ 11:00\n(정비 시간)",
            "세부 진행 내용": "• 1차 운영 피드백, 기념품 수량 점검 및 태블릿 충전",
            "담당 및 장소": "팀장단"
        },
        {
            "시간": "12:40 ~ 13:30\n(점심시간)",
            "세부 진행 내용": "• [2차 운영] 고학년(4~6학년) 및 전교생 자율 참여\n• 심화 방탈출 미션 및 골든벨 퀴즈 운영",
            "담당 및 장소": "전원\n(각 부스별 위치)"
        },
        {
            "시간": "13:30 ~ 14:00\n(행사 마감)",
            "세부 진행 내용": "• 기자재 회수, 행사장 주변 청소 및 분리수거\n• 6학년 3반 자체 활동 평가 및 소감 나눔",
            "담당 및 장소": "전원\n(담임교사 지도)"
        }
    ])
    hwp.table_from_data(df_schedule, index=False, treat_as_char=True, cell_fill=(230, 240, 252), header_bold=True)
    hwp.set_col_width([24, 52, 24])
    hwp.MoveDocEnd()
    hwp.BreakPara()

    # 6. 소요 예산 및 준비물(안)
    insert_section_title("6. 소요 예산 및 준비물(안)")
    df_budget = pd.DataFrame([
        {"항목": "정보화 기자재", "내용 및 수량": "태블릿PC 5대, 이동식 TV 1대, 멀티탭 2개", "예산": "0원 (학교 보유 물품)"},
        {"항목": "홍보·안내물", "내용 및 수량": "Canva 인쇄 포스터(A3) 5장, 부스 팻말, 스탬프 카드", "예산": "0원 (학교 인쇄실)"},
        {"항목": "진행 용품", "내용 및 수량": "스탬프 도장, 우드락 보드판, 포스트잇, 필기도구", "예산": "15,000원 (학급비)"},
        {"항목": "참가 기념품", "내용 및 수량": "독도 캐릭터 스티커 세트, 참가 보상 간식(젤리 등)", "예산": "35,000원 (학급비)"},
        {"항목": "합계", "내용 및 수량": "총 4개 영역 준비물 구비", "예산": "50,000원"}
    ])
    hwp.table_from_data(df_budget, index=False, treat_as_char=True, cell_fill=(230, 240, 252), header_bold=True)
    hwp.set_col_width([24, 52, 24])
    hwp.MoveDocEnd()
    hwp.BreakPara()

    # 7. 기대 효과
    insert_section_title("7. 기대 효과")
    insert_body_text("가. 10월 25일 독도의 날을 맞아 전교생이 독도의 역사와 가치를 친근하게 학습한다.")
    insert_body_text("나. 6학년 3반 학생들이 부스 기획부터 실행까지 주도하며 협력적 문제 해결력과 리더십을 신장한다.")
    insert_body_text("다. 디지털 도구(Canva, 독도 앱)를 활용하여 미래지향적이고 흥미로운 계기교육 모델을 실천한다.")

    # 저장
    hwp.save_as(output_path, format="HWPX")
    hwp.quit()
    print("HWPX_SUCCESS:", output_path)

if __name__ == "__main__":
    create_dokdo_plan()
