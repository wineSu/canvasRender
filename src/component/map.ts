import { BaseElement } from './base';
import {
    getTileUrl,
    TILE_SIZE,
    getTileRowAndCol,
    lngLatToMercator,
    getPxFromLngLat,
    clipPosition
} from "../util";

interface MapData {
    // 鼠标按下标志
    isMousedown: boolean
    // 缓存瓦片实例
    tileCache: any
    // 记录当前画布上需要的瓦片
    currentTileCache: any
    // 初始中心经纬度
    center: number[] // 雷锋塔
    // 初始缩放层级
    zoom: number
    // 缩放层级范围
    minZoom: number,
    maxZoom: number,
    // 缩放相关
    lastZoom: number
    scale: number
    scaleTmp: number
}

// 瓦片类
class Tile {
    ctx: CanvasRenderingContext2D
    row: number
    col: number
    zoom: number
    position: {
        x: number
        y: number
        left: number
        top: number
        width: number
        height: number
    }
    shouldRender: (key: string) => string
    url: string
    cacheKey: string
    img: HTMLImageElement | null
    loaded: boolean
    timer: NodeJS.Timeout | null

    constructor({ ctx, row, col, zoom, position, shouldRender }) {
        // 画布上下文
        this.ctx = ctx;
        // 瓦片行列号
        this.row = row;
        this.col = col;
        // 瓦片层级
        this.zoom = zoom;
        // 显示位置
        this.position = position;
        // 判断瓦片是否应该渲染
        this.shouldRender = shouldRender;
        // 瓦片url
        this.url = "";
        // 缓存key
        this.cacheKey = this.row + "_" + this.col + "_" + this.zoom;
        // 图片
        this.img = null;
        // 图片是否加载完成
        this.loaded = false;
        // 图片加载超时定时器
        this.timer = null;
        this.createUrl();
        this.load();
    }
    // 生成url
    createUrl() {
        this.url = getTileUrl(this.row, this.col, this.zoom);
    }
    // 加载图片
    load() {
        this.img = new Image();
        this.img.src = this.url;
        // 加载超时，重新加载
        this.timer = setTimeout(() => {
            this.createUrl();
            this.load();
        }, 1000);
        this.img.onload = () => {
            this.timer && clearTimeout(this.timer);
            this.loaded = true;
            this.render();
        };
    }
    // 将图片渲染到canvas上
    render() {
        if (!this.loaded || !this.shouldRender(this.cacheKey)) {
            return;
        }
        if (this.img) {
            // 超出区域裁剪
            const {
                x, y, w, h, originX, originY, originW, originH
            } = clipPosition(this.position, this.img);

            if(typeof w !== 'undefined' 
                && typeof h !== 'undefined' 
                    && typeof originX !== 'undefined' 
                        && typeof originY !== 'undefined' 
                            && originW 
                                && originH
            ) {
                this.ctx.drawImage(this.img, x, y, w, h, originX, originY, originW, originH)
            } else {
                this.ctx.drawImage(this.img, x, y)
            }
        }
    }
    // 更新位置
    updatePos(x, y) {
        this.position.x = x;
        this.position.y = y;
        return this;
    }
}

/**
 * 盒子绘制
 */
export class MapElement extends BaseElement {

    data: MapData

    constructor(props) {
        super(props);

        this.data = {
            isMousedown: false,
            tileCache: {},
            currentTileCache: {},
            center: props['data-center'].split(','),
            zoom: 14,
            minZoom: 3,
            maxZoom: 18,
            lastZoom: 0,
            scale: 1,
            scaleTmp: 1,
        }
    }

    render = (ctx: CanvasRenderingContext2D) => {
        const { layout, style } = this.props;
        let { left, right, top, bottom, width, height } = layout;
        
        ctx.save();
        ctx.clearRect(left, top, width, height);

        if (style.background) {
            ctx.fillStyle = style.background;
            ctx.fillRect(left, top, width, height);
        }

        this.renderTiles(left, top, width, height, ctx);

        ctx.restore();
    }

    renderTiles = (left, top, width, height, ctx) => {
        const [originX, originY] = this.data.center;
        // 中心点对应的瓦片
        const [x, y] = lngLatToMercator(originX, originY);
        let centerTile = getTileRowAndCol(x, y, this.data.zoom);

        // 中心瓦片左上角对应的像素坐标
        let centerTilePos = [
            centerTile[0] * TILE_SIZE,
            centerTile[1] * TILE_SIZE,
        ];

        // 中心点对应的像素坐标
        let centerPos = getPxFromLngLat(originX, originY, this.data.zoom);

        // 中心像素坐标距中心瓦片左上角的差值
        let offset = [
            centerPos[0] - centerTilePos[0],
            centerPos[1] - centerTilePos[1],
        ];

        // 计算瓦片数量
        let rowMinNum = Math.ceil((width / 2 - offset[0]) / TILE_SIZE);
        let colMinNum = Math.ceil((height / 2 - offset[1]) / TILE_SIZE);
        let rowMaxNum = Math.ceil(
            (width / 2 - (TILE_SIZE - offset[0])) / TILE_SIZE
        );
        let colMaxNum = Math.ceil(
            (height / 2 - (TILE_SIZE - offset[1])) / TILE_SIZE
        );

        // 渲染画布内所有瓦片
        this.data.currentTileCache = {}; // 清空缓存对象
        for (let i = -rowMinNum; i <= rowMaxNum; i++) {
            for (let j = -colMinNum; j <= colMaxNum; j++) {
                // 当前瓦片的行列号
                let row = centerTile[0] + i;
                let col = centerTile[1] + j;

                // 当前瓦片的显示位置
                let x = i * TILE_SIZE - Number(offset[0]) + width / 2 + left;
                let y = j * TILE_SIZE - Number(offset[1]) + height / 2 + top;

                // 缓存key
                let cacheKey = row + "_" + col + "_" + this.data.zoom;
                // 记录当前需要的瓦片
                this.data.currentTileCache[cacheKey] = true;
                // 该瓦片已加载过
                if (this.data.tileCache[cacheKey]) {
                    this.data.tileCache[cacheKey].updatePos(x, y).render();
                } else {
                    // 未加载过
                    this.data.tileCache[cacheKey] = new Tile({
                        ctx,
                        row,
                        col,
                        zoom: this.data.zoom,
                        position: {
                            x, y, left, top, width, height
                        },
                        // 判断瓦片是否在当前画布缓存对象上，是的话则代表需要渲染
                        shouldRender: (key) => {
                            return this.data.currentTileCache[key];
                        },
                    });
                }
            }
        }
    }
}
