export interface Announcement {
  id: string;            // 고유 ID — 변경하면 dismissed가 초기화됨
  type: "info" | "update" | "setup";
  message: string;
  linkText?: string;
  linkHref?: string;
  active: boolean;       // false면 표시 안 함
}

// 배너 추가/수정 시 이 배열만 변경하면 됩니다.
// id를 바꾸면 이전에 닫은 사용자에게도 다시 표시됩니다.
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "setup-v2",
    type: "setup",
    message: "아직 설치 전이라면 터미널에서 한 줄이면 완료!",
    linkText: "Setup Guide →",
    linkHref: "/setup",
    active: true,
  },
  // 예시: 업데이트 공지
  // {
  //   id: "update-2026-03-10",
  //   type: "update",
  //   message: "v2.1 업데이트: Gemini CLI 자동 수집이 추가되었습니다. 재설치 필요!",
  //   linkText: "재설치 방법 →",
  //   linkHref: "/setup",
  //   active: true,
  // },
];
