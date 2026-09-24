import type { Asset, DrawingObject } from '@/domain/project';
export function ObjectShape({ object: o, assets }: { object: DrawingObject; assets: Asset[] }) {
  const t = o.transform;
  return <g transform={`translate(${t.x} ${t.y}) rotate(${t.rotation}) scale(${t.scale})`} data-object-id={o.id}>
    {o.type === 'image' ? <image href={assets.find(a => a.id === o.assetId)?.source} width={o.width} height={o.height} preserveAspectRatio="none" /> :
      o.type === 'line' ? <><line x2={o.end.x} y2={o.end.y} stroke="transparent" strokeWidth={5} /><line x2={o.end.x} y2={o.end.y} stroke={o.color} strokeWidth={o.width} /></> :
      o.type === 'point' ? <circle r={1.5} fill="#304c43" /> : <text style={{ fontSize: o.fontSize }} fill="#203b32">{o.text || ' '}</text>}
  </g>;
}
