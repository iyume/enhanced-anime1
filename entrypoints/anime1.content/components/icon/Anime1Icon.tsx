import type { FC } from 'react'

export const Anime1Icon: FC<{ size?: string, color?: string }> = ({ size = '18px', color = 'white' }) => {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 180.000000 180.000000"
      preserveAspectRatio="xMidYMid meet"
      style={{ color }}
    >
      <g
        transform="translate(0.000000,180.000000) scale(0.100000,-0.100000)"
        fill="currentColor"
        stroke="none"
      >
        <path d="M1165 1622 c-162 -85 -170 -89 -535 -315 -217 -135 -255 -163 -340
-247 -73 -73 -105 -114 -137 -175 -68 -130 -73 -165 -73 -472 0 -298 1 -302
66 -329 53 -22 328 -19 374 4 57 28 60 42 60 298 l0 232 43 42 c86 87 166 150
302 240 134 88 243 150 265 150 7 0 10 -57 8 -172 l-3 -173 -240 -2 c-165 -2
-247 -7 -263 -15 -46 -24 -52 -54 -52 -242 l0 -176 29 -32 29 -33 248 -5 247
-5 11 -39 c20 -71 45 -81 224 -84 174 -4 220 4 251 45 21 25 21 34 21 774 l0
747 -26 31 -26 31 -166 0 -167 0 -150 -78z"
        />
      </g>
    </svg>
  )
}
