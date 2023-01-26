export class TokenOccluder{
    constructor() {
        this.renderer = canvas.app.renderer;//PIXI.autoDetectRenderer();
        this.renderTexture = PIXI.RenderTexture.create({
            width: canvas.dimensions.width, height: canvas.dimensions.height
        });
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;
        this.indexer = new Map();
        this.tileToIndexer = new Map();
        this.renderTextureSprite = null;

        this.generateAlphaMaskIndex();
    }


    destructor(){
        // this.container.destroy()
        // this.renderTexture.destroy()
        // this.renderer.destroy()
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
    #cloneAlphaTileSprite(tile) {
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
                        color.r = 1.0;
                        color.g = 1.0;
                        color.b = 1.0;
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

        let cloned_tile = this.#cloneAlphaTileSprite(tile);
        this.container.addChild(cloned_tile);
        this.tileToIndexer.set(tile_id, [null, cloned_tile]);
    }

    getSpriteMask(){
        // console.error(this.renderer.extract.base64(this.renderTexture));
        // debugger;
        return this.renderTexture;

    }

    refreshToken(token){
        // cut here
        // // todo: !!! make it work with token magic for fun and profit
        // if (token.mesh.filters != null && token.mesh.filters.length > 0) return;
        // let renderTexture= Isostate.getInstance().getMaskTexture();
        // let textureMask =  new TextureMaskFilter(renderTexture);
        // token.mesh.filters = [textureMask];
    }

}



export const fragment = `varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D mask;
uniform float alpha;
uniform float npmAlpha;
uniform vec4 maskClamp;

void main(void)
{
    float clip = step(3.5,
        step(maskClamp.x, vMaskCoord.x) +
        step(maskClamp.y, vMaskCoord.y) +
        step(vMaskCoord.x, maskClamp.z) +
        step(vMaskCoord.y, maskClamp.w));

    vec4 original = texture2D(uSampler, vTextureCoord);
    vec4 masky = texture2D(mask, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    original *= (alphaMul * masky.r * alpha * clip);

    gl_FragColor = original;
}`

export const fragment3 = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D mask;
varying vec2 vMaskCoord;
uniform mat4 colorMatrix;

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord)* colorMatrix;
    vec4 mask = texture2D(mask, vMaskCoord);
    if (mask.a != 0.0){
        // color.r = color2.r;
        // color.g = color2.g;
        // color.b = color2.b;
        //color.a = 0.0;
        // color = mix(color, vec4(1.0) - color, 1);
        // color = color * Color;
        // color = color * colorMatrix;
    }
    gl_FragColor = color;
}
`

export const fragment2 = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D mask;
varying vec2 vMaskCoord;
uniform float m[20];

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);
    vec4 mask = texture2D(mask, vMaskCoord);
    if (mask.a != 0.0){
        // color.r = color2.r;
        // color.g = color2.g;
        // color.b = color2.b;
        //color.a = 0.0;
        // color = mix(color, vec4(1.0) - color, 1);
        // color = color * Color;
        // color = color * colorMatrix;
        vec4 c = color;
        if (c.a > 0.0) {
        c.rgb /= c.a;
    }
    vec4 result;
    result.r = (m[0] * c.r);
    result.r += (m[1] * c.g);
    result.r += (m[2] * c.b);
    result.r += (m[3] * c.a);
    result.r += m[4];
    result.g = (m[5] * c.r);
    result.g += (m[6] * c.g);
    result.g += (m[7] * c.b);
    result.g += (m[8] * c.a);
    result.g += m[9];
    result.b = (m[10] * c.r);
    result.b += (m[11] * c.g);
    result.b += (m[12] * c.b);
    result.b += (m[13] * c.a);
    result.b += m[14];
    result.a = (m[15] * c.r);
    result.a += (m[16] * c.g);
    result.a += (m[17] * c.b);
    result.a += (m[18] * c.a);
    result.a += m[19];
    vec3 rgb = mix(c.rgb, result.rgb, 1.5);
    rgb *= result.a;
    gl_FragColor = vec4(rgb, result.a);
    }
    else{
        gl_FragColor = color;
    }
}
`
export const fragment222 = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D mask;
varying vec2 vMaskCoord;
uniform float m[20];

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);
    vec4 mask = texture2D(mask, vMaskCoord);
    if ((mask.a != 0.0) && color.a != 0.0){
        // color.r = color.r*10.0;
        // color.g = color2.g;
        // color.b = color2.b;
        // color.a = 0.0;
        // color = mix(color, vec4(1.0) - color, 1);
        // color = color * Color;
        // color = color * colorMatrix;
        
        vec4 COLOR = vec4(1.0,1.0,1.0,1.0);
        COLOR.rgb = vec3(1.0,0.0,0.0);

        vec2 size = vec2(1.0) /vec2(100.0,100.0);
        float alpha = color.a;
        alpha += texture2D(uSampler, vTextureCoord + vec2(0.0, -size.y)).a;
        alpha += texture2D(uSampler, vTextureCoord + vec2(size.x, -size.y)).a;
        alpha += texture2D(uSampler, vTextureCoord + vec2(size.x, 0.0)).a;
        alpha += texture2D(uSampler, vTextureCoord + vec2(size.x, size.y)).a;
        alpha += texture2D(uSampler, vTextureCoord + vec2(0.0, size.y)).a;
        alpha += texture2D(uSampler, vTextureCoord + vec2(-size.x, size.y)).a;
        alpha += texture2D(uSampler, vTextureCoord + vec2(-size.x, 0.0)).a;
        alpha += texture2D(uSampler, vTextureCoord + vec2(-size.x, -size.y)).a;
        if (alpha >= 9.0) {
            alpha = 0.0;
        }
        COLOR = vec4(mask.rgb, min(alpha, 1.0) * color.a);
            gl_FragColor = COLOR;
    }
    else{
        gl_FragColor = color;
    }
}
`

export const fragment244 = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D mask;
varying vec2 vMaskCoord;


void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);
    vec4 mask = texture2D(mask, vMaskCoord);
    color.a = color.a * (1.0-(mask.a));
    //  color.a = color.a * mask.a;
    gl_FragColor = color; 
   
}
`
export const fragment22 = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D mask;
varying vec2 vMaskCoord;
uniform mat4 colorMatrix;
void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord)* colorMatrix;
    vec4 mask = texture2D(mask, vMaskCoord);
    if (mask.a != 0.0){

        
    }
    gl_FragColor = color;
}
`

export const vertex =`attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 otherMatrix;

varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;
}`



export class TextureMaskFilter extends PIXI.Filter
{

    maskMatrix;
    maskTexture;

    /** @ignore */
    constructor(texture)
    {
        super(vertex, fragment2, undefined);

        this.maskTexture = texture;
        this.maskMatrix = new PIXI.Matrix();
    }


    calculateSpriteMatrix(outputMatrix, texture, filterManager)
    {
        // debugger;
        const { sourceFrame, destinationFrame } = filterManager.activeState;
        const { orig } = texture;
        const mappedMatrix = outputMatrix.set(destinationFrame.width, 0, 0,
            destinationFrame.height, sourceFrame.x, sourceFrame.y);
        const worldTransform = canvas.stage.worldTransform.copyTo(PIXI.Matrix.TEMP_MATRIX);

        worldTransform.invert();
        mappedMatrix.prepend(worldTransform);
        mappedMatrix.scale(1.0 / orig.width, 1.0 / orig.height);
        // mappedMatrix.translate(sprite.anchor.x, sprite.anchor.y);

        return mappedMatrix;
    }

    /**
     * Applies the filter
     * @param filterManager - The renderer to retrieve the filter from
     * @param input - The input render target.
     * @param output - The target to output to.
     * @param clearMode - Should the output be cleared before rendering to it.
     */
    apply(filterManager, input, output, clearMode)
    {
        const tex = this.maskTexture;

        if (!tex.valid)
        {
            return;
        }
        if (!tex.uvMatrix)
        {
            // margin = 0.0, let it bleed a bit, shader code becomes easier
            // assuming that atlas textures were made with 1-pixel padding
            tex.uvMatrix = new PIXI.TextureMatrix(tex, 0.0);
        }
        tex.uvMatrix.update();

        this.uniforms.npmAlpha = tex.baseTexture.alphaMode ? 0.0 : 1.0;
        this.uniforms.mask = tex;
        // get _normalized sprite texture coords_ and convert them to _normalized atlas texture coords_ with `prepend`
        this.uniforms.otherMatrix = this.calculateSpriteMatrix(this.maskMatrix, tex, filterManager)
            .prepend(tex.uvMatrix.mapCoord);
        // this.uniforms.alpha = maskSprite.worldAlpha;
        this.uniforms.maskClamp = tex.uvMatrix.uClampFrame;

        const x = -1 * 2 / 3 + 1;
        const y = (x - 1) * -0.5;
        const matrix2 = [
            x,
            y,
            y,
            0,
            0,
            y,
            x,
            y,
            0,
            0,
            y,
            y,
            x,
            0,
            0,
            0,
            0,
            0,
            1,
            0
        ];
        const amount =1;
        const matrix = [
            11.224130630493164 * amount,
            -4.794486999511719 * amount,
            -2.8746118545532227 * amount,
            0 * amount,
            0.40342438220977783 * amount,
            -3.6330697536468506 * amount,
            9.193157196044922 * amount,
            -2.951810836791992 * amount,
            0 * amount,
            -1.316135048866272 * amount,
            -3.2184197902679443 * amount,
            -4.2375030517578125 * amount,
            7.476448059082031 * amount,
            0 * amount,
            0.8044459223747253 * amount,
            0,
            0,
            0,
            1,
            0
        ]
        this.uniforms.m =matrix;


        filterManager.applyFilter(this, input, output, clearMode);
    }
}
