// 깡이 캐릭터 동작 그림. 포즈가 바뀌면 살짝 튀어 오르고, 평소엔 천천히 들썩인다(동작 줄이기 설정이면 멈춤).
// 표정은 분위기만 전한다: 구매를 권하거나 결정이 끝난 것처럼 쓰지 않는다.
export type KkangPose =
  | 'pro_wave' | 'pro_excited' | 'pro_present' | 'pro_jump' | 'pro_think' | 'pro_shy'
  | 'con_curious' | 'con_inspect' | 'con_question' | 'con_surprised' | 'con_note' | 'con_relieved'
  | 'guide_greet' | 'guide_listen' | 'guide_present' | 'guide_moderate' | 'guide_review' | 'guide_wave'

type Props = { pose: KkangPose; size?: 'sm' | 'md' | 'lg'; delay?: number; className?: string }

export default function Kkang({ pose, size = 'md', delay = 0, className = '' }: Props) {
  return (
    <img
      key={pose}
      src={`/assets/kkang/ui_${pose}.png`}
      alt=""
      className={`kkang kkang-${size} ${className}`}
      style={{ animationDelay: `0s, ${delay}s` }}
    />
  )
}
