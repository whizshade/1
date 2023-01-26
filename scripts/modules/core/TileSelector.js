import {GLOW_FILTER} from "./init.js";

export class TileSelector {
    //based on https://webglfundamentals.org/webgl/lessons/webgl-picking.html
    constructor() {
        this.renderer = PIXI.autoDetectRenderer();
        this.renderTexture = PIXI.RenderTexture.create({
            width: canvas.dimensions.width, height: canvas.dimensions.height
        });
        this.container = new PIXI.Container({name: "TileSelector"});
        this.container.sortableChildren = true;
        this.indexer = new Map();
        this.tileToIndexer = new Map();
        this.generateAlphaMaskIndex();
        this.WALL_GLOW_FILTER = GLOW_FILTER;
    }

    destructor(){
        this.container.destroy()
        this.renderTexture.destroy()
        this.renderer.destroy()
    }





    deleteTileFromIndex(tile_id){
        let [indexer_index, cloned_tile] = this.tileToIndexer.get(tile_id)
        cloned_tile.destroy()
        this.indexer.delete(indexer_index);
        this.tileToIndexer.delete(tile_id);

        this.generateAlphaMaskIndex();

    }

    reindexTile(tile_id) {
        let [indexer_index, cloned_tile] = this.tileToIndexer.get(tile_id);
        let tile = canvas.primary.tiles.get(`Tile.${tile_id}`);
        this.#copyTileToSprite(cloned_tile,tile);

        this.generateAlphaMaskIndex();
    }

    #copyTileToSprite(sprite,tile){
        sprite.anchor = tile.anchor;
        sprite.width = tile.width;
        sprite.height = tile.height;
        sprite.position = tile.position;
        sprite.scale = tile.scale;
        sprite.angle = tile.angle;
        sprite.zIndex = tile.zIndex;
    }
    #cloneAlphaTileSprite(tile, r, g, b) {
        let sprite = new PIXI.Sprite.from(tile.texture);
        sprite.tint = 16777215;
        sprite.isSprite = true;
        sprite.blendMode = 0;
        sprite.name = tile.id;
        sprite.drawMode = 4;

        this.#copyTileToSprite(sprite,tile);

        sprite.filters = [new PIXI.Filter(`
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            void main(void)
            {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
`, `
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform float delta;
                void main(void)
                {
                    vec4 color = texture2D(uSampler, vTextureCoord);
                    if (color.a != 0.0){
                        color.r = ${r};
                        color.g = ${g};
                        color.b = ${b};
                    }
                    gl_FragColor = color;
                }
`)]
        return sprite;
    }

    generateAlphaMaskIndex() {
        canvas.tiles.objects.children.sort().forEach((t, i) => {
            if (!this.tileToIndexer.has(t.document._id)) {
                this.#addTileToIndex(t.document._id,i)
            }
        })

        let renderTexture = this.renderTexture;
        this.renderer.render(this.container, {
            renderTexture
        });
    }
    #addTileToIndex(tile_id,index){
        let tile = canvas.primary.tiles.get(`Tile.${tile_id}`);
        let [r, g, b] = PIXI.utils.hex2rgb(index);
        r = Number.parseFloat(r).toFixed(17);
        g = Number.parseFloat(g).toFixed(17);
        b = Number.parseFloat(b).toFixed(17);
        let cloned_tile = this.#cloneAlphaTileSprite(tile, r, g, b);
        this.container.addChild(cloned_tile);
        let indexer_index = r + g + b;
        this.indexer.set(indexer_index, tile_id);
        this.tileToIndexer.set(tile_id, [indexer_index, cloned_tile]);
    }

    #testPixel(x, y) {
        let [r, g, b, a] = this.#getRGBPixel(this.renderer, this.renderTexture, x, y)
        if (a < 1) {
            return null;
        }
        r = Number.parseFloat(r / 255.0).toFixed(17);
        g = Number.parseFloat(g / 255.0).toFixed(17);
        b = Number.parseFloat(b / 255.0).toFixed(17);
        let tile_id = this.indexer.get(r + g + b);
        if (!tile_id) {
            return null;
        }
        return tile_id
    }

    #getRGBPixel(renderer, renderTexture, x, y) {
        let resolution;
        resolution = renderTexture.baseTexture.resolution;
        // let frame =  renderTexture.frame;
        renderer.renderTexture.bind(renderTexture);
        // const width = Math.round(frame.width * resolution);
        // const height = Math.round(frame.height * resolution);
        const webglPixels = new Uint8Array(4);
        // read pixels to the array
        const gl = renderer.gl;
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, webglPixels);

        return webglPixels;
    }

    tileContains(tile) {
        let $this = this;
        tile.hitArea.contains = function (x, y) {
            if (this.width <= 0 || this.height <= 0) {
                return false;
            }
            if (x >= this.x && x < this.x + this.width) {
                if (y >= this.y && y < this.y + this.height) {
                    if (tile.controlled) return true;
                    const tempPoint = {x: 0, y: 0}
                    let glob = tile.toGlobal(new PIXI.Point(x, y));
                    canvas.stage.worldTransform.applyInverse(glob, tempPoint);
                    return (tile.document._id === $this.#testPixel(tempPoint.x, tempPoint.y))
                }
            }
            return false;
        }
    }
    tileHover(tile, hovered){
        if (hovered) {
            tile.mesh.filters = [this.WALL_GLOW_FILTER]
        } else {
            tile.mesh.filters = []
        }
    }
}
