/**
 * 地图绘制相关转换公式
 */
interface Position {
    x: number
    y: number
    width: number
    height: number
    left: number
    top: number
}

interface RealPosition {
    x: number
    y: number
    w?: number
    h?: number
    originX?: number
    originY?: number
    originW?: number
    originH?: number
}

// 角度转弧度
const angleToRad = (angle) => {
    return angle * (Math.PI / 180)
}

// 弧度转角度
const radToAngle = (rad) => {
    return rad * (180 / Math.PI)
}

// 地球半径
const EARTH_RAD = 6378137

// 4326转3857
export const lngLatToMercator = (lng, lat) => {
    // 经度先转弧度，然后因为 弧度 = 弧长 / 半径 ，得到弧长为 弧长 = 弧度 * 半径
    let x = angleToRad(lng) * EARTH_RAD
    // 纬度先转弧度
    let rad = angleToRad(lat)
    let sin = Math.sin(rad)
    let y = (EARTH_RAD / 2) * Math.log((1 + sin) / (1 - sin))
    return [x, y]
}

// 3857转4326
export const mercatorToLngLat = (x, y) => {
    let lng = radToAngle(x) / EARTH_RAD
    let lat = radToAngle(2 * Math.atan(Math.exp(y / EARTH_RAD)) - Math.PI / 2)
    return [lng, lat]
}

// 地球周长
const EARTH_PERIMETER = 2 * Math.PI * EARTH_RAD
// 瓦片像素
export const TILE_SIZE = 256

// 获取某一层级下的分辨率
export const getResolution = (n) => {
    const tileNums = Math.pow(2, n)
    const tileTotalPx = tileNums * TILE_SIZE
    return EARTH_PERIMETER / tileTotalPx
}

// 分辨率列表
export const resolutions: any[] = []
for (let i = 0; i <= 18; i++) {
    resolutions.push(getResolution(i))
}

// 转换3857坐标的原点
export const transformXY = (x, y, origin = 'topLeft') => {
    if (origin === 'topLeft') {
        x += EARTH_PERIMETER / 2
        y = EARTH_PERIMETER / 2 - y
    }
    return [x, y]
}

// 根据4326坐标及缩放层级计算瓦片行列号
export const getTileRowAndCol = (lng, lat, z, opt: any = {}) => {
    const [a, b] = (opt.lngLatToMercator || lngLatToMercator)(lng, lat);
    let [x, y] = transformXY(a,b, opt.origin)
    let resolution = (opt.resolutions || resolutions)[z]
    let row = Math.floor(x / resolution / TILE_SIZE)
    let col = Math.floor(y / resolution / TILE_SIZE)
    return [row, col]
}

// 计算4326经纬度对应的像素坐标
export const getPxFromLngLat = (lng, lat, z, opt: any = {}) => {
    const [a, b] = (opt.lngLatToMercator || lngLatToMercator)(lng, lat);
    let [_x, _y] = transformXY(a,b, opt.origin)
    let resolution = (opt.resolutions || resolutions)[z]
    let x = Math.floor(_x / resolution)
    let y = Math.floor(_y / resolution)
    return [x, y]
}

// 拼接瓦片地址
export const getTileUrl = (x, y, z) => {
    let domainIndexList = [1, 2, 3, 4]
    let domainIndex =
        domainIndexList[Math.floor(Math.random() * domainIndexList.length)]
    return `https://webrd0${domainIndex}.is.autonavi.com/appmaptile?x=${x}&y=${y}&z=${z}&lang=zh_cn&size=1&scale=1&style=8`
}

// 随机获取url子域索引
export const getRandomDomainIndex = (url) => {
    // 检查是否支持多个子域
    let res = url.match(/\{[\d-]+\}/)
    if (res) {
        let arr = res[0].slice(1, -1).split(/\s*-\s*/)
        let domainIndexList: number[] = []
        for (let i = Number(arr[0]); i <= Number(arr[1]); i++) {
            domainIndexList.push(i)
        }
        return domainIndexList[Math.floor(Math.random() * domainIndexList.length)]
    }
    return null
}

// 拼接瓦片地址
export const getTileUrlPro = (x, y, z, url, {transformXYZ, getTileUrl} = ({} as any)) => {
    // 检查是否支持多个子域
    let domainIndex = getRandomDomainIndex(url)
    if (domainIndex) {
        url = url.replace(/\{[\d-]+\}/, domainIndex)
    }
    // 自定义url拼接方法
    if (getTileUrl) {
        return getTileUrl(x, y, z)
    }
    // 转换x、y、z
    if (transformXYZ) {
        let res = transformXYZ(x, y, z)
        x = res[0]
        y = res[1]
        z = res[2]
    }
    return url.replace('{x}', x).replace('{y}', y).replace('{z}', z)
}

/**
 * 计算渲染真正位置
 */
export const clipPosition: (position: Position, img: any) => RealPosition = (position, img) => {
    const {x, y, width, height, left, top} = position;
    if(x < left || y < top) {
        if(x + TILE_SIZE > left + width) {
            return {
                x: 0,
                y: top - y,
                w: left + width - x,
                h: TILE_SIZE - top + y,
                originX: x,
                originY: top,
                originW: left + width - x,
                originH: TILE_SIZE - top + y,
            }
        }

        if(y + TILE_SIZE > top + height) {
            return {
                x: left-x,
                y: 0,
                w: TILE_SIZE - left + x,
                h: height + top - y,
                originX: left,
                originY: y,
                originW: TILE_SIZE - left + x,
                originH: height + top - y,
            }
        }

        return {
            x: Math.max(left - x, 0),
            y: Math.max(top - y, 0),
            w: Math.max(TILE_SIZE - left + x, TILE_SIZE),
            h: Math.max(TILE_SIZE - top + y, TILE_SIZE),
            originX: Math.max(left, x),
            originY: Math.max(top, y),
            originW: Math.max(TILE_SIZE - left + x, TILE_SIZE),
            originH: Math.max(TILE_SIZE - top + y, TILE_SIZE),
        }
    }

    if(x + TILE_SIZE > left + width || y + TILE_SIZE > top + height) {
        return {
            x: 0,
            y: 0,
            w: Math.min(width + left - x, TILE_SIZE),
            h: Math.min(height + top - y, TILE_SIZE),
            originX: x,
            originY: y,
            originW: Math.min(width + left - x, TILE_SIZE),
            originH: Math.min(height + top - y, TILE_SIZE),
        }
    }

    return {
        x, y
    };
}

export const KEY = '0913a20b5d5a703b920e1ff0d9d26559'

export function shallowEqual(object1, object2) {
    const keys1: string[] = Object.keys(object1);
    const keys2: string[] = Object.keys(object2);

    if (keys1.length !== keys2.length) {
      return false;
    }
  
    for (let index = 0; index < keys1.length; index++) {
      const val1 = object1[keys1[index]];
      const val2 = object2[keys2[index]];
      if (val1 !== val2) {
        return false;
      }
    }
    return true;
}
