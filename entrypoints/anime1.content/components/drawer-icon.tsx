import bangumiIcon from '~/assets/bangumi-icon.png'

export function DrawerIcon({ className = '', iconSize = 24 }) {
  return (
    <div className={`rounded-full bg-(--background) border-2 border-(--primary) ${className}`}>
      {/* <img src={anime1Icon} width={iconSize} height={iconSize} />
      <X size={xSize} className="text-(--anime1-primary)" /> */}
      <div className="p-2">
        <img src={bangumiIcon} width={iconSize} height={iconSize} />
      </div>
    </div>
  )
}
