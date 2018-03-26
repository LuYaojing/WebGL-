var 图像处理 = (function () {
	"use strict"

	const WGLRC = WebGL2RenderingContext;

	var 处理 = {};

	var 处理程序集类 = function () {

		this._程序集 = {};

		this.添加程序 = function (标识, 处理程序, 初始化) {
			if (Object.prototype.toString.apply(标识) == "[object String]" && 标识) {
				if (Object.prototype.toString.apply(处理程序) == "[object Function]")
					this._程序集[标识] = 处理程序
				else {
					console.warn('“处理程序”需要是一个函数！');
					return;
				}

			}
			else
				console.warn('“标识”参数不是非空字符串，处理程序需要命名！');
		}

		this.获取程序 = function (标识) {
			let 程序 = this._程序集[标识];
			if (Object.prototype.toString.apply(程序) == "[object Function]") {
				return 程序;
			}
			else {
				console.log('没有找到指定的程序：', 标识);
			}
		}

	};

	var 处理程序集 = new 处理程序集类();

	var 类型化数组对应GL类型 = {
		"[object Float32Array]": WGLRC.FLOAT,
		"[object Uint16Array]": WGLRC.UNSIGNED_SHORT,
		"[object Int16Array]": WGLRC.SHORT,
		"[object Uint32Array]": WGLRC.UNSIGNED_INT,
		"[object Int32Array]": WGLRC.INT,
		"[object Int8Array]": WGLRC.BYTE,
		"[object Uint8Array]": WGLRC.UNSIGNED_BYTE,
	};

	//var webgl2;

	var 处理器类 = function (画布, 名称) {

		画布 = (Object.prototype.toString.apply(画布) == "[object HTMLCanvasElement]") ? 画布 : document.createElement('canvas');
		this._画布 = 画布;

		/*
		if (上下文)
			this.gl=初始化WebGL(画布, (this.上下文=上下文))
		else
			this.gl=初始化WebGL(画布, (this.上下文="webgl"))||初始化WebGL(画布, (this.上下文="experimental-webgl"))||初始化WebGL(画布, (this.上下文="webgl2"));
		*/

		//if (!webgl2) webgl2=初始化WebGL(画布, 'webgl2');
		//this.gl	= webgl2;
		this.gl = 初始化WebGL(画布, 'webgl2', { antialias: false });

		if (!this.gl) {
			throw "初始化图像处理器失败，可能是因为您的浏览器不支持WebGL2.0。";
			return;
		}

		this.名称 = 名称 || "";

		const gl = this.gl;

		this._ext = gl.getExtension('EXT_color_buffer_float');

		this._最大纹理数 = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) - 1;//最后一个纹理单元留给一般纹理修改使用。
		this._纹理数 = 0;

		this._图像集 = { 序号集: { 'uToBeProcessedImage': 0 }, 纹理集: Array(this._最大纹理数) };
		this._图像集.纹理集[0] = { 标识: 'uToBeProcessedImage' };

		this._序号池 = [];
		for (let i = this._最大纹理数 - 1; i >= 1; i--)
			this._序号池.push(i);

		//this._WEBGL_draw_buffers = gl.getExtension('WEBGL_draw_buffers');
		this._绘图区集 = {};//{标识: 绘图区};
		this._当前绘图区 = null;
		//this._读取绘图区 = new 绘图区类(this);
		this._着色程序集 = {};//{标识: 着色程序信息};

		this._未就绪资源 = 0;
		this._已启动 = false;
		this._处理线已启动 = false;

		this._完成回调 = null;
		this._完成回调参数 = null;

		this._处理结果纹理 = null;
		this._结果纹理已提取 = false;

		this._默认处理器 = function () { };
		this._默认处理器参数 = [];

		this._当前处理器 = this._默认处理器;
		this._当前处理器参数 = [];
		//第一个处理器的第一个参数是要处理的图像，其他的处理器的第一个参数应该为null，他会被替换。
		this._处理线 = [[this._默认处理器, [null], '默认处理器']];//[[处理器, [图像||null, 参数1, 参数2, ...], '名称可选']];
		//this.处理器返回值;

		this._面数 = 2;

		this._待载入图像 = [];

		this._已销毁 = false;

	}

	处理器类.prototype = {

		执行程序: function () {

			let 待载入 = this._待载入图像;
			let 未载入 = [];
			for (let i = 0; i < 待载入.length; i++) {

				let 参数 = 待载入.pop();
				if (参数.就绪)
					this.载入图像(参数.图像, 参数.标识, 参数.选项)
				else
					未载入.push(参数);

			}
			this._待载入图像 = 未载入;

			if (this._未就绪资源 === 0 && (this._已启动 || this._处理线已启动)) {
				let start = window.performance.now();

				if (this._当前绘图区 instanceof 绘图区类)
					this._当前绘图区.刷新画板();

				if (this._已启动) {
					this._已启动 = false;
					//let 处理器返回值 = this.处理器返回值;
					//if (处理器返回值)
					//	for (let i=0, l=处理器返回值.length; i<l; i++) 处理器返回值[i].纹理.销毁();
					//this.处理器返回值 = this._当前处理器.apply( this, this._当前处理器参数 );
					this._当前处理器.apply(this, this._当前处理器参数);
					this._当前处理器 = this._默认处理器;
					this._当前处理器参数 = [];
				}

				if (this._处理线已启动) {
					this._处理线已启动 = false;
					let 处理线 = this._处理线;
					let 处理器 = 处理线[0];
					//let 返回值 = 
					处理器[0].apply(this, 处理器[1]);
					for (let i = 1, l = 处理线.length; i < l; i++) {
						let 处理器 = 处理线[i];
						处理器[1][0] = null;
						//let 待销毁 = 返回值;
						//返回值 = 
						处理器[0].apply(this, 处理器[1]);
						//if (待销毁)
						//	for (let i=0, l=待销毁.length; i<l; i++) 待销毁[i].纹理.销毁();
					}
					//let 处理器返回值 = this.处理器返回值;
					//if (处理器返回值)
					//	for (let i=0, l=处理器返回值.length; i<l; i++) 处理器返回值[i].纹理.销毁();
					//this.处理器返回值 = 返回值;
					this._处理线 = [[this._默认处理器, [null], '默认处理器']];
				}
				console.log(window.performance.now() - start, '执行程序: function(){');
				this._结果纹理已提取 = false;
				let 本 = this;
				Object.prototype.toString.apply(this._完成回调) == "[object Function]" && this._完成回调.apply(this, this._完成回调参数);
				this._完成回调 = null;
				this._完成回调参数 = null;

			}

		},

		启动: function () {

			this._已启动 = true;
			this._处理线已启动 = false;

			this.执行程序();

		},

		启动处理线: function () {

			this._处理线已启动 = true;
			this._已启动 = false;

			this.执行程序();

		},

		绘制元素: function (vertexCount) {

			const gl = this.gl;
			/*				
				for(let i=0;i<32;i++){
					gl.activeTexture( gl['TEXTURE' + i] );
					let tex = gl.getParameter(gl.TEXTURE_BINDING_2D);
					if (tex)
						console.log(i,':',tex)
					else
						if (i===0) debugger;
				}
				console.log('绘制元素: function(');
			*/
			gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0);

			//const offset = 0;
			//const vertexCount = 4;
			//gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);

		},

		get 面数() {

			return this._面数;

		},

		set 面数(值) {

			if (值 > 0)
				this._面数 = 值;

		},

		get 纹理数() {

			return this._纹理数;

		},

		set 纹理数(值) {

			console.warn("此属性只读。");

		},

		get 画布宽() {

			return this._画布.width;

		},

		set 画布宽(值) {

			console.warn("此属性只读。");

		},

		get 画布高() {

			return this._画布.height;

		},

		set 画布高(值) {

			console.warn("此属性只读。");

		},

		get 当前绘图区() {

			return this._当前绘图区;

		},

		set 当前绘图区(值) {

			console.warn("此属性只读。");

		},


		get 处理结果纹理() {

			return this._处理结果纹理;

		},

		set 处理结果纹理(值) {

			console.warn("此属性只读。");

		},

		设置完成回调: function (回调, 参数) {
			this._完成回调 = 回调;
			this._完成回调参数 = 参数;
		},

		提取处理结果纹理: function () {

			if (this._结果纹理已提取) {
				console.warn("“结果纹理”已经提取,不能再次提取。");
				return null;
			}

			this._结果纹理已提取 = true;
			if (this._当前绘图区 instanceof 绘图区类) {
				let 纹理 = this._当前绘图区.提取画板('');
				if (纹理 && 纹理[0]) {
					this._处理结果纹理 = 纹理[0].纹理;
					return this._处理结果纹理;
				}
				console.warn("“当前绘图区”没有设置“默认纹理”，不能提取纹理。");
				return null;
			}

			console.warn("没有设置“当前绘图区”，不能提取纹理。");
			return null;


		},

		获取已处理图像: function (浮点数颜色, 转换为图像) {

			const gl = this.gl;
			const 画布 = this._画布;

			if (this._当前绘图区 instanceof 绘图区类) return this._当前绘图区.获取画板图像('', 浮点数颜色, 转换为图像);

			//gl.readBuffer(gl.COLOR_ATTACHMENT0);

			let 数据, 类型;

			if (浮点数颜色) {
				数据 = new Float32Array(宽 * 高 * 4);
				类型 = gl.FLOAT;
			}
			else {
				数据 = new Uint8Array(宽 * 高 * 4);
				类型 = gl.UNSIGNED_BYTE;
			}

			gl.readPixels(0, 0, 宽, 高, gl.RGBA, 类型, 数据);

			if (转换为图像) {

				let 图像 = new Uint8ClampedArray(宽 * 高 * 4);

				let 长度 = 数据.length;
				for (let i = 0; i < 长度; i++) 图像[i] = 数据[i] * 255;

				数据 = new ImageData(图像, 宽, 高);

			}

			return 数据;


		},

		获取纹理: function (标识) {

			const 纹理集 = this._图像集.纹理集;
			const 序号集 = this._图像集.序号集;

			if (Object.prototype.toString.apply(标识) == "[object String]") {

				const 序号 = 序号集[标识];
				if (Object.prototype.toString.apply(序号) == "[object Number]" &&
					序号 < 纹理集.length && 纹理集[序号] &&
					纹理集[序号].纹理 instanceof 纹理类) {

					const 记录 = 纹理集[序号];
					return { 纹理: 记录.纹理, 序号: 序号 };

				}

			}
			else {

				if (标识 < 纹理集.length && 纹理集[标识] &&
					纹理集[标识].纹理 instanceof 纹理类) {

					const 记录 = 纹理集[标识];
					return { 纹理: 记录.纹理, 序号: 标识 };

				}

			}

			console.warn("不能找到指定的纹理：" + 标识);
			return null;

		},

		显示到画布: (function () {

			const 片元着色程序源 = `#version 300 es
				
				in highp vec2 vTextureCoord;

				uniform sampler2D uToBeProcessedImage;
				
				out highp vec4 fragColor[4];
				
				void main(void) {
					
					fragColor[0] = texture( uToBeProcessedImage, vec2( vTextureCoord.x, 1.0 - vTextureCoord.y ) );
				
				}
			`;

			return function () {

				if (!(this._当前绘图区 instanceof 绘图区类)) return;

				var 程序信息 = this._着色程序集._复写;
				if (!程序信息) 程序信息 = new 图像处理着色程序信息类(this, 片元着色程序源);
				this._着色程序集._复写 = 程序信息;

				//let 纹理 = this._当前绘图区.提取画板( '' );
				//if (纹理 && 纹理[0]){


				程序信息.使用程序();
				const gl = this.gl;

				let 宽 = this._当前绘图区.宽, 高 = this._当前绘图区.高;
				let 画板 = new 纹理类(this, null, { 宽: 宽, 高: 高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST });

				gl.bindTexture(gl.TEXTURE_2D, 画板.WEBGL纹理);
				gl.readBuffer(gl.COLOR_ATTACHMENT0);
				gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 宽, 高, 0);

				let 画布 = this._画布;

				if (画布.width !== 宽 || 画布.height !== 高) {

					画布.width = 宽;
					画布.height = 高;

					画布.style.width = 宽 + 'px';
					画布.style.height = 高 + 'px';

					this._当前绘图区.更改尺寸(宽, 高)
					gl.viewport(0, 0, 宽, 高);

				}

				this.添加纹理(画板, 'uToBeProcessedImage');

				this.gl.bindFramebuffer(gl.FRAMEBUFFER, null);

				程序信息.绑定纹理('uToBeProcessedImage');
				this.绘制元素(this._面数 * 3);

				//this._当前绘图区.添加画板(画板, '默认画板');
				this._当前绘图区.启用();

				return;

				//}

				console.warn("没有已处理的图像需要显示。");
			}

		}()),


		/*
		显示到画布: function(){
			
			if (!(this._当前绘图区 instanceof 绘图区类)) return;
			
			const gl = this.gl;
			let 画布 = this._画布;
			
			this._当前绘图区.启用(true);
			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
			
			gl.blitFramebuffer(0, 0, 画布.width, 画布.height,
							   0, 0, 画布.width, 画布.height,
							   gl.COLOR_BUFFER_BIT, gl.NEAREST);
					   
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			//gl.finish();	
			this._当前绘图区.启用(false);
			
		},*/

		添加纹理: function (纹理, 标识, 返回旧纹理) {

			if (!(纹理 instanceof 纹理类)) {
				console.warn("“纹理”参数类型不正确！");
				return;
			}

			return this.载入图像(纹理, 标识, 返回旧纹理);

		},

		清除纹理: function (标识) {

			const 纹理集 = this._图像集.纹理集;
			const 序号集 = this._图像集.序号集;
			const gl = this.gl;

			if (标识 === undefined) {
				this._纹理数 = 0;
				序号集 = { 'uToBeProcessedImage': 0 };

				for (let i = 0; i < 纹理集.length; i++) {
					let 纹理 = 纹理集[i].纹理;
					纹理.设置销毁方法();
					纹理.销毁();
				}

				纹理集 = Array(this._最大纹理数);
				纹理集[0] = { 标识: 'uToBeProcessedImage' };

				this._序号池 = [];
				for (let i = this._最大纹理数 - 1; i >= 1; i++)
					this._序号池.push(i);

			}
			else {

				if (Object.prototype.toString.apply(标识) == "[object String]") {

					if (标识 === 'uToBeProcessedImage') {

						let 纹理 = 纹理集[0].纹理;
						纹理.设置销毁方法();
						纹理.销毁();

						return;

					}
					else {

						const 序号 = 序号集[标识];
						if (Object.prototype.toString.apply(序号) == "[object Number]" &&
							序号 < 纹理集.length && 纹理集[序号] &&
							纹理集[序号].纹理 instanceof 纹理类) {

							delete 序号集[标识];

							let 纹理 = 纹理集[序号].纹理;
							纹理.设置销毁方法();
							纹理.销毁();

							纹理集[序号] = undefined;
							this._序号池.push(序号);

							return;

						}

					}

				}
				else {

					if (标识 < 纹理集.length && 纹理集[标识] &&
						纹理集[标识].纹理 instanceof 纹理类) {

						if (标识 === 0) {

							let 纹理 = 纹理集[0].纹理;
							纹理.设置销毁方法();
							纹理.销毁();

						}
						else {

							const 记录 = 纹理集[标识];

							纹理集[标识] = undefined;
							delete 序号集[记录.标识];

							let 纹理 = 记录.纹理;
							纹理.设置销毁方法();
							纹理.销毁();

							this._序号池.push(标识);

						}

						return;

					}

				}

				console.warn("没有找到要删除的指定纹理：" + 标识);

			}

		},

		载入图像: function (图像, 标识, 选项, 操作回调, 返回旧纹理) {
			const 本 = this;
			const 纹理集 = this._图像集.纹理集;
			const 序号集 = this._图像集.序号集;

			const gl = 本.gl;

			if (Object.prototype.toString.apply(选项) != "[object Object]") 选项 = {};
			选项.多级贴图 = 选项.多级贴图 === undefined ? false : 选项.多级贴图;
			选项.缩小过滤 = 选项.缩小过滤 === undefined ? gl.NEAREST : 选项.缩小过滤;
			选项.放大过滤 = 选项.放大过滤 === undefined ? gl.NEAREST : 选项.放大过滤;

			if (Object.prototype.toString.apply(标识) != "[object String]" || 标识 === "")
				if (this._纹理数)
					标识 = "纹理" + (this._纹理数)
				else
					标识 = 'uToBeProcessedImage';

			var 序号 = 序号集[标识], 返回值 = null;
			if (Object.prototype.toString.apply(序号) == "[object Number]" &&
				序号 < 纹理集.length && 纹理集[序号]) {

				if (纹理集[序号].纹理 instanceof 纹理类) {
					let 纹理 = 纹理集[序号].纹理;
					if (纹理 === 图像) {
						console.warn('该纹理已存在。');
						return;
					}

					纹理.设置销毁方法();
					if (返回旧纹理)
						返回值 = { 纹理: 纹理, 标识: 标识 }
					else
						纹理.销毁();

					/*
					if ( 返回旧纹理 ){
						纹理.设置销毁方法();
						返回值 = {纹理: 纹理, 标识: 标识};
					}
					else{
						if ( 图像 instanceof 纹理类 ){
							纹理.设置销毁方法();
							纹理.销毁();
						}
						else{
							纹理.替换图像( 图像, 选项, 操作回调 );
							return null;
						}
					}
					*/					//
				}

			}
			else {

				this._纹理数++;
				if (this._最大纹理数 < this._纹理数) {

					this._纹理数 = this._最大纹理数;
					let a = this._纹理数 - 1;
					this._序号池.push(a);

					let 记录 = 纹理集[a];
					let 纹理 = 记录.纹理;
					if (纹理 === 图像) {
						console.warn('该纹理已存在。');
						return;
					}

					纹理.设置销毁方法();
					if (返回旧纹理)
						返回值 = { 纹理: 纹理, 标识: 标识 }
					else
						纹理.销毁();

					delete 序号集[记录.标识];

					console.warn("纹理数已达到WebGL的最大限制，最后一个纹理已被覆盖！");

				}

				序号集[标识] = 序号 = this._序号池.pop();
				纹理集[序号] = { 标识: 标识 };

			}

			const 销毁方法 = function () { };

			if (图像 instanceof 纹理类) {
				图像.设置销毁方法(销毁方法);
				纹理集[序号].纹理 = 图像;
				if (标识 == 'uToBeProcessedImage') {
					let 宽 = 图像.宽, 高 = 图像.高;
					let 画布 = this._画布;
					画布.width = 宽;
					画布.height = 高;

					画布.style.width = 宽 + 'px';
					画布.style.height = 高 + 'px';

					if (this._当前绘图区 instanceof 绘图区类)
						this._当前绘图区.更改尺寸(宽, 高)
					else
						gl.viewport(0, 0, 宽, 高);

				}
			}
			else {

				//gl.activeTexture( gl[ 'TEXTURE' + 序号 ] );

				纹理集[序号].纹理 = new 纹理类(this, 图像, 选项, (WEBGL纹理, 宽, 高) => {

					if (标识 == 'uToBeProcessedImage') {

						let 画布 = 本._画布;
						画布.width = 宽;
						画布.height = 高;

						画布.style.width = 宽 + 'px';
						画布.style.height = 高 + 'px';

						if (本._当前绘图区 instanceof 绘图区类)
							本._当前绘图区.更改尺寸(宽, 高)
						else
							gl.viewport(0, 0, 宽, 高);

					}

					Object.prototype.toString.apply(操作回调) == "[object Function]" && 操作回调(WEBGL纹理, 宽, 高);

				}, 销毁方法, 标识);

			}

			return 返回值;

		},

		添加绘图区: function (标识, 画板, 选项) {

			const 本 = this;
			const 绘图区集 = this._绘图区集;

			const gl = this.gl;

			if (Object.prototype.toString.apply(标识) != "[object String]" || 标识 === "") {
				console.warn('“标识”参数必须是非空字符串！');
				return;
			}

			var 记录 = 绘图区集[标识];
			var 绘图区 = 记录 ? 记录.绘图区 : null;
			if (绘图区 instanceof 绘图区类) {
				console.warn('绘图区“' + 标识 + '”已存在。');
				return;
			}
			else {

				if (!(画板 instanceof 纹理类)) {

					if (Object.prototype.toString.apply(选项) != "[object Object]") 选项 = {};
					选项.多级贴图 = 选项.多级贴图 === undefined ? false : 选项.多级贴图;
					选项.缩小过滤 = 选项.缩小过滤 === undefined ? gl.NEAREST : 选项.缩小过滤;
					选项.放大过滤 = 选项.放大过滤 === undefined ? gl.NEAREST : 选项.放大过滤;
					选项.宽 = 选项.宽 === undefined ? this.画布宽 : 选项.宽;
					选项.高 = 选项.高 === undefined ? this.画布高 : 选项.高;

					画板 = new 纹理类(this, null, 选项);

				}

				绘图区 = new 绘图区类(this, 画板, 标识);
				绘图区集[标识] = 绘图区;

			}

		},

		获取绘图区: function (标识) {

			const 绘图区集 = this._绘图区集;
			var 绘图区 = 绘图区集[标识];

			if (绘图区 instanceof 绘图区类)
				return 绘图区
			else
				console.warn("没有找到指定的绘图区：" + 标识);

			return null;

		},

		更换绘图区: function (标识, 更改尺寸) {

			if (标识 === undefined || 标识 === null) {

				this._当前绘图区 = null;
				this.gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				return;

			}

			const gl = this.gl;
			let 绘图区 = this.获取绘图区(标识);
			if (绘图区) {

				绘图区.启用();
				this._当前绘图区 = 绘图区;
				if (更改尺寸) {
					let 画布 = this._画布;
					绘图区.更改尺寸(画布.width, 画布.height);
				}
			}

		},

		设置默认处理程序: function (处理程序, 参数数组) {
			this._默认处理器 = Object.prototype.toString.apply(处理程序) == "[object Function]" ? 处理程序 : this._默认处理器;
			this._默认处理器参数 = Object.prototype.toString.apply(参数数组) == "[object Array]" ? 参数数组 : [参数数组];
			//let 处理器返回值 = this.处理器返回值;
			//if (处理器返回值)
			//	for (let i=0, l=处理器返回值.length; i<l; i++) 处理器返回值[i].纹理.销毁();
			//this.处理器返回值 = null;
		},

		设置处理程序: function (处理程序, 参数数组) {
			this._当前处理器 = Object.prototype.toString.apply(处理程序) == "[object Function]" ? 处理程序 : this._默认处理器;
			this._当前处理器参数 = Object.prototype.toString.apply(参数数组) == "[object Array]" ? 参数数组 : [参数数组];
			//let 处理器返回值 = this.处理器返回值;
			//if (处理器返回值)
			//	for (let i=0, l=处理器返回值.length; i<l; i++) 处理器返回值[i].纹理.销毁();
			//this.处理器返回值 = null;
		},

		设置处理线: function (处理线) {

			//let 处理器返回值 = this.处理器返回值;
			//if (处理器返回值)
			//	for (let i=0, l=处理器返回值.length; i<l; i++) 处理器返回值[i].纹理.销毁();
			//this.处理器返回值 = null;
			if (Object.prototype.toString.apply(处理线) == "[object Array]") {

				let 合格 = [];
				for (let i = 0, l = 处理线.length; i < l; i++) {

					let 处理器 = 处理线[i];
					if (Object.prototype.toString.apply(处理器) == "[object Array]" && 处理器.length) {

						if (Object.prototype.toString.apply(处理器[0]) == "[object Function]") {

							if (处理器.length > 1) {

								let 参数 = 处理器[1];
								if (Object.prototype.toString.apply(参数) == "[object Array]") {
									if (参数.length == 0)
										参数.push(null);
								}
								else
									参数 = [参数];

								处理器[1] = 参数;

							}
							else
								处理器.push([null]);

							if (处理器.length == 2)
								处理器.push('');

							合格.push(处理器);

						}

					}

				}

				if (合格.length > 0) {
					this._处理线 = 合格;
					return;
				}

			}
			this._处理线 = [[this._默认处理器, [null], '默认处理器']];

		},

		准备图像: function (图像, 标识, 选项) {

			const 本 = this;

			this._未就绪资源++;

			if (Object.prototype.toString.apply(图像) == "[object String]") {

				let img = new Image();
				let 待载入 = { 图像: img, 标识: 标识, 选项: 选项, 就绪: false };
				this._待载入图像.push(待载入);
				img.addEventListener('load', function (event) {

					待载入.就绪 = true;
					本._未就绪资源--;
					本.执行程序();

				}, false);

				img.src = 图像;

			}
			else {

				this._待载入图像.push({ 图像: 图像, 标识: 标识, 选项: 选项, 就绪: true });

				本._未就绪资源--;
				本.执行程序();

			}


		},

		销毁: function () {

			if (this._已销毁) return;

			let 纹理集 = this._图像集.纹理集;
			for (let i = 0, l = 纹理集.length; i < l; i++) {
				let 记录 = 纹理集[i];
				if (记录 && 记录.纹理 instanceof 纹理类) {
					let 纹理 = 记录.纹理;
					纹理.设置销毁方法();
					纹理.销毁();
				}
			};

			if (this._处理结果纹理 instanceof 纹理类) {
				this._处理结果纹理.设置销毁方法();
				this._处理结果纹理.销毁();
			}

			this._图像集.纹理集 = null;
			this._图像集 = null;

			this._序号池 = null;


			for (let Key in this._绘图区集) this._绘图区集[Key].销毁();
			this._绘图区集 = null;

			for (let Key in this._着色程序集) this._着色程序集[Key].销毁();
			this._着色程序集 = null;

			if (this._当前绘图区)
				this._当前绘图区.销毁();
			this._当前绘图区 = null;

			this._完成回调 = null;
			this._完成回调参数 = null;

			this._默认处理器 = null;
			this._默认处理器参数 = null;

			this._当前处理器 = null;
			this._当前处理器参数 = null;

			this._处理线 = null;
			//let 处理器返回值 = this.处理器返回值;
			//if (处理器返回值)
			//	for (let i=0, l=处理器返回值.length; i<l; i++) 处理器返回值[i].纹理.销毁();
			//this.处理器返回值 = null;

			this._面数 = 0;

			this._待载入图像 = null;

			this._画布 = null;
			this.gl = null;
			this._ext = null;

			this._已销毁 = true;

		},

	}

	var 纹理类 = function (处理器, 图像, 选项, 就绪回调, 销毁方法, 名称) {

		if (!(处理器 instanceof 处理器类)) {
			throw "“处理器”参数无效！";
			return;
		}

		this._处理器 = 处理器;
		const gl = this._处理器.gl;

		if (Object.prototype.toString.apply(选项) != "[object Object]") 选项 = {};

		选项.级别 = 选项.级别 || 0;
		选项.宽 = 选项.宽 || 1;
		选项.高 = 选项.高 || 1;
		选项.边框 = 选项.边框 || 0;

		选项.多级贴图 = 选项.多级贴图 || true;
		选项.横向折回 = 选项.横向折回 || gl.REPEAT;
		选项.纵向折回 = 选项.纵向折回 || gl.REPEAT;
		选项.缩小过滤 = 选项.缩小过滤 || gl.LINEAR;
		选项.放大过滤 = 选项.放大过滤 || gl.LINEAR;

		this.名称 = 名称 || "";

		选项.内部格式 = 选项.内部格式 || gl.RGBA32F;
		选项.源格式 = 选项.源格式 || gl.RGBA;
		选项.源类型 = 选项.源类型 || gl.FLOAT;

		this._选项 = 选项;

		this._就绪回调 = (纹理, 宽, 高) => {

			选项.宽 = 宽;
			选项.高 = 高;

			Object.prototype.toString.apply(就绪回调) == "[object Function]" && 就绪回调(纹理, 宽, 高);

		}

		this._WEBGL纹理 = 载入WEBGL纹理(gl, 图像, this._就绪回调, 选项);

		this._销毁方法 = 销毁方法;

		const 本 = this;
		this._默认销毁方法 = function () {

			if (this._已销毁) return;
			纹理销毁数++;
			//console.log('gl.deleteTexture( 本._WEBGL纹理 );');
			gl.deleteTexture(本._WEBGL纹理);
			本._WEBGL纹理 = null;

			本._就绪回调 = null;
			本._处理器 = null;
			本._销毁方法 = null;
			this._已销毁 = true;

		}

		this._已销毁 = false;

	}

	纹理类.prototype = {

		get WEBGL纹理() {
			return this._WEBGL纹理;
		},

		set WEBGL纹理(值) {
			console.warn("此属性只读。");
		},

		get 源格式() {
			return this._选项.源格式;
		},

		set 源格式(值) {
			console.warn("此属性只读。");
		},

		get 内部格式() {
			return this._选项.内部格式;
		},

		set 内部格式(值) {
			console.warn("此属性只读。");
		},

		get 宽() {
			return this._选项.宽;
		},

		set 宽(值) {
			console.warn("此属性只读。");
		},

		get 高() {
			return this._选项.高;
		},

		set 高(值) {
			console.warn("此属性只读。");
		},

		get 横向折回() {
			return this._选项.横向折回;
		},

		set 横向折回(值) {
			if (isPowerOf2(this._选项.宽) && isPowerOf2(this._选项.高)) {
				this._选项.横向折回 = 值;
				const gl = this._处理器.gl;
				gl.bindTexture(gl.TEXTURE_2D, this._WEBGL纹理);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, 值);
			}
		},

		get 纵向折回() {
			return this._选项.纵向折回;
		},

		set 纵向折回(值) {
			if (isPowerOf2(this._选项.宽) && isPowerOf2(this._选项.高)) {
				this._选项.纵向折回 = 值;
				const gl = this._处理器.gl;
				gl.bindTexture(gl.TEXTURE_2D, this._WEBGL纹理);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, 值);
			}
		},

		get 缩小过滤() {
			return this._选项.缩小过滤;
		},

		set 缩小过滤(值) {
			if (isPowerOf2(this._选项.宽) && isPowerOf2(this._选项.高)) {
				this._选项.缩小过滤 = 值;
				const gl = this._处理器.gl;
				gl.bindTexture(gl.TEXTURE_2D, this._WEBGL纹理);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 值);
			}
			else
				if (值 === gl.LINEAR || 值 === gl.NEAREST) {
					this._选项.缩小过滤 = 值;
					const gl = this._处理器.gl;
					gl.bindTexture(gl.TEXTURE_2D, this._WEBGL纹理);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 值);
				};
		},

		get 放大过滤() {
			return this._选项.放大过滤;
		},

		set 放大过滤(值) {
			this._选项.放大过滤 = 值;
			const gl = this._处理器.gl;
			gl.bindTexture(gl.TEXTURE_2D, this._WEBGL纹理);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 值);
		},

		更改选项: function (选项) {

			let _选项 = this._选项;

			_选项.级别 = 选项.级别 !== undefined ? 选项.级别 : _选项.级别;
			_选项.宽 = 选项.宽 !== undefined ? 选项.宽 : _选项.宽;
			_选项.高 = 选项.高 !== undefined ? 选项.高 : _选项.高;
			_选项.边框 = 选项.边框 !== undefined ? 选项.边框 : _选项.边框;

			_选项.多级贴图 = 选项.多级贴图 !== undefined ? 选项.多级贴图 : _选项.多级贴图;
			_选项.横向折回 = 选项.横向折回 !== undefined ? 选项.横向折回 : _选项.横向折回;
			_选项.纵向折回 = 选项.纵向折回 !== undefined ? 选项.纵向折回 : _选项.纵向折回;
			_选项.缩小过滤 = 选项.缩小过滤 !== undefined ? 选项.缩小过滤 : _选项.缩小过滤;
			_选项.放大过滤 = 选项.放大过滤 !== undefined ? 选项.放大过滤 : _选项.放大过滤;

			_选项.内部格式 = 选项.内部格式 !== undefined ? 选项.内部格式 : _选项.内部格式;
			_选项.源格式 = 选项.源格式 !== undefined ? 选项.源格式 : _选项.源格式;
			_选项.源类型 = 选项.源类型 !== undefined ? 选项.源类型 : _选项.源类型;

		},

		替换图像: function (图像, 选项, 就绪回调) {

			const 本 = this;

			this.更改选项(选项);

			var _就绪回调 = (纹理, 宽, 高) => {

				本._选项.宽 = 宽;
				本._选项.高 = 高;

				Object.prototype.toString.apply(就绪回调) == "[object Function]" && 就绪回调(纹理, 宽, 高);

			}

			this._WEBGL纹理 = 载入WEBGL纹理(this._处理器.gl, 图像, _就绪回调, 本._选项, this._WEBGL纹理);

		},

		销毁: function () {

			if (this._已销毁) return;

			if (Object.prototype.toString.apply(this._销毁方法) == "[object Function]")
				this._销毁方法()
			else
				this._默认销毁方法();

			this._已销毁 = true;

		},

		默认销毁方式: function () {
			this._默认销毁方法();
		},

		设置销毁方法: function (销毁方法) {
			this._销毁方法 = 销毁方法;
		},

	}

	var 绘图区类 = function (处理器, 画板, 名称) {

		if (!(处理器 instanceof 处理器类)) {
			throw "“处理器”参数无效！";
			return;
		}

		this._处理器 = 处理器;
		const gl = this._处理器.gl;
		帧缓冲创建数++;
		this._绘图区 = gl.createFramebuffer();
		if (!this._绘图区) {
			throw "“绘图区”创建失败！";
			return;
		}

		this.名称 = 名称 || "";

		/*
		this._WEBGL_draw_buffers = gl.getExtension('WEBGL_draw_buffers');
		if ( !this._WEBGL_draw_buffers ){
			throw "您的浏览器可能不支持多目标渲染！";
			return;
		}
		*/

		this._绘图区宽 = 0;
		this._绘图区高 = 0;

		this.需要刷新 = true;

		this._最大画板数 = gl.getParameter(gl.MAX_COLOR_ATTACHMENTS);

		this._画板数 = 1;
		this._渲染目标序列 = { 有效: [], 无效: [] };

		this._画板集 = { 序号集: { '默认画板': 0 }, 画板集: Array(this._画板数) };
		this._画板集.画板集[0] = { 标识: '默认画板', 画板编号: gl.COLOR_ATTACHMENT0 };

		this._序号池 = [];
		for (let i = this._最大画板数 - 1; i >= 1; i--)
			this._序号池.push(i);

		this._编号池 = [];
		for (let i = this._最大画板数 - 1; i >= 1; i--)
			this._编号池.push(gl['COLOR_ATTACHMENT' + i]);

		this._编号序列 = [];
		for (let i = 0; i < this._最大画板数; i++)
			this._编号序列.push(gl['COLOR_ATTACHMENT' + i]);

		this._画板默认选项 = { 宽: 处理器.画布宽, 高: 处理器.画布高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST };
		if (!(画板 instanceof 纹理类))
			画板 = new 纹理类(处理器, null, this._画板默认选项);

		this.添加画板(画板, '默认画板');

		this._已销毁 = false;

	}

	绘图区类.prototype = {

		get 画板数() {
			return this._画板数;
		},

		set 画板数(值) {
			console.warn("此属性只读。");
		},

		get 最大画板数() {
			return this._最大画板数;
		},

		set 最大画板数(值) {
			console.warn("此属性只读。");
		},

		get 宽() {
			return this._绘图区宽;
		},

		set 宽(值) {
			console.warn("此属性只读。");
		},

		get 高() {
			return this._绘图区高;
		},

		set 高(值) {
			console.warn("此属性只读。");
		},

		启用: function (读取) {

			const gl = this._处理器.gl;
			if (读取) {

				//if (gl.getParameter(gl.READ_FRAMEBUFFER_BINDING) !== this._绘图区)
				gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this._绘图区);

				//gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
				//for (let i = 1, l = this._最大画板数; i < l; i++)
				//	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl['COLOR_ATTACHMENT'+i], gl.TEXTURE_2D, null, 0);
			}
			else {

				if (gl.getParameter(gl.FRAMEBUFFER_BINDING) !== this._绘图区)
					gl.bindFramebuffer(gl.FRAMEBUFFER, this._绘图区);//gl.DRAW_FRAMEBUFFER

				gl.drawBuffers(this._编号序列);
				this.刷新画板();
				this.更改尺寸();

			}


		},

		刷新画板: function () {

			if (!this.需要刷新) return;

			const gl = this._处理器.gl;
			if (gl.getParameter(gl.FRAMEBUFFER_BINDING) !== this._绘图区) return;

			this.需要刷新 = false;

			let 有效目标集 = this._渲染目标序列.有效;
			let 无效目标集 = this._渲染目标序列.无效;

			let 目标数 = 无效目标集.length;
			for (let i = 0; i < 目标数; i++) {
				let 编号 = 无效目标集.pop();
				gl.framebufferTexture2D(gl.FRAMEBUFFER, 编号, gl.TEXTURE_2D, null, 0);
				//gl.invalidateFramebuffer(gl.FRAMEBUFFER, [编号]);
			}

			目标数 = 有效目标集.length;
			for (let i = 0; i < 目标数; i++) {
				let 目标 = 有效目标集.pop();
				gl.framebufferTexture2D(gl.FRAMEBUFFER, 目标.画板编号, gl.TEXTURE_2D, 目标.纹理.WEBGL纹理, 0);
			}

			/*			
			for(let i=0;i<this._最大画板数;i++){
					let pad = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl['COLOR_ATTACHMENT'+i], gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
					if (pad)
						console.log(pad,';  刷新i:',i);
			}		
			console.log("刷新画板。");	
			*/
		},

		启用默认绘图区: function () {
			const gl = this._处理器.gl;
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		},

		更改尺寸: function (宽, 高) {

			const gl = this._处理器.gl;
			if (宽 > 0 && 高 > 0 && 宽 !== this._绘图区宽 && 高 !== this._绘图区高) {

				const 画板集 = this._画板集.画板集;
				this._绘图区宽 = 宽;
				this._绘图区高 = 高;

				for (let i = 0; i < 画板集.length; i++) {
					let 画板 = 画板集[i];
					if (画板 && 画板.纹理 instanceof 纹理类) 画板.纹理.替换图像(null, { 宽: 宽, 高: 高 });
				}

				gl.viewport(0, 0, 宽, 高);

			}
			else {
				gl.viewport(0, 0, this._绘图区宽, this._绘图区高);
			}

		},

		添加画板: function (画板, 标识, 返回旧的) {

			var 记录 = 画板;
			if (Object.prototype.toString.apply(画板) != "[object Array]") {
				var 记录 = [画板];
			}

			const 长度 = 记录.length;

			var 标 = 标识;
			if (Object.prototype.toString.apply(标识) != "[object Array]") {
				标 = Array(长度);
				标[0] = 标识;
			}
			else {
				if (标.length < 长度) {
					标.concat(Array(长度 - 标.length));
				}
			}

			const 画板集 = this._画板集.画板集;
			const 序号集 = this._画板集.序号集;

			//const ext = this._WEBGL_draw_buffers;
			const 最大画板数 = this._最大画板数;
			const gl = this._处理器.gl;

			let 已启用 = gl.getParameter(gl.FRAMEBUFFER_BINDING) === this._绘图区;
			let 有效目标集 = this._渲染目标序列.有效;
			//let 无效目标集 = this._渲染目标序列.无效;

			let 添加数 = 0, 替换数 = 0, 覆盖数 = 0;

			let 返回值 = [];

			for (let i = 0; i < 长度; i++) {

				画板 = 记录[i];
				标识 = 标[i];

				if (!(画板 instanceof 纹理类)) {
					console.warn("第" + i + "个“画板”参数无效！");
					break;
				}

				画板.更改选项({ 多级贴图: false });

				if ((Object.prototype.toString.apply(标识) != "[object String]" && Object.prototype.toString.apply(标识) != "[object Number]") ||
					标识 === "" || 标识 < 0 || 标识 >= 最大画板数)
					if (this._画板数)
						标识 = "画板" + (this._画板数)
					else
						标识 = '默认画板';

				if (标识 == '默认画板' || 标识 == 0) {
					if (!this._绘图区宽 || !this._绘图区高) {
						this._绘图区宽 = 画板.宽;
						this._绘图区高 = 画板.高;
						this.更改尺寸();
					}
				}

				if (this._绘图区宽 !== 画板.宽 || this._绘图区高 !== 画板.高) {
					console.warn("第" + i + "个“画板”的尺寸与绘图区尺寸不同，不能被添加！");
					break;
				}

				var 顺序 = 0, 序号;
				if (Object.prototype.toString.apply(标识) == "[object Number]") {
					序号 = 标识;
					标识 = 画板集[序号];
					if (Object.prototype.toString.apply(标识) == "[object Object]" && 标识.标识)
						标识 = 标识.标识;
					标识 = 标识 + '';
				}
				else
					序号 = 序号集[标识];

				if (Object.prototype.toString.apply(序号) == "[object Number]" &&
					序号 < 画板集.length && 画板集[序号]) {

					if (画板集[序号].纹理 instanceof 纹理类)
						if (返回旧的)
							返回值.push({ 纹理: 画板集[序号].纹理, 标识: 标识 })
						else
							画板集[序号].纹理.销毁();

					替换数++;

				}
				else {

					添加数++;

					this._画板数++;
					if (最大画板数 < this._画板数) {

						添加数--;
						覆盖数++;

						this._画板数 = 最大画板数;

						let a = 最大画板数 - 1;
						this._序号池.push(a);
						//this._编号池.push(gl['COLOR_ATTACHMENT'+a]);

						const 记录 = 画板集[a];

						delete 序号集[记录.标识];

						console.warn("画板数已达到WebGL的最大限制，最后一个画板已被替换！");

						let 余下 = 长度 - 1 - i;

						if (余下) {
							console.warn("余下的" + 余下 + "个画板将不再添加。");
							break;
						}

					}

					序号集[标识] = 序号 = this._序号池.pop();
					画板集[序号] = { 标识: 标识 };
					画板集[序号].画板编号 = gl['COLOR_ATTACHMENT' + 序号];//this._编号池.pop();
					顺序 = this._画板数 - 1;

				}

				画板集[序号].纹理 = 画板;
				画板集[序号].顺序 = 顺序;

				let 编号 = 画板集[序号].画板编号;//gl['COLOR_ATTACHMENT'+顺序];
				//画板集[序号].画板编号 = 编号;

				if (已启用)
					gl.framebufferTexture2D(gl.FRAMEBUFFER, 编号, gl.TEXTURE_2D, 画板.WEBGL纹理, 0)
				else
					有效目标集.push({ 画板编号: 编号, 纹理: 画板, 顺序: 顺序 });

			}

			if (添加数 || 替换数 || 覆盖数) {

				this.需要刷新 = true;

			}

			return 返回值;

		},

		清除画板: function (标识) {

			const 画板集 = this._画板集.画板集;
			const 序号集 = this._画板集.序号集;

			//const ext = this._WEBGL_draw_buffers;
			const gl = this._处理器.gl;

			//this.启用();
			let 已启用 = gl.getParameter(gl.FRAMEBUFFER_BINDING) === this._绘图区;

			let 已找到 = false;
			let 是默认 = false;
			let 顺序 = 0;
			let 编号 = 0;


			if (标识 === undefined) {

				this._画板数 = 1;

				for (let i = 0; i < 画板集.length; i++) {
					画板集[i].纹理.销毁();
				}

				this._画板集 = { 序号集: { '默认画板': 0 }, 画板集: Array(this._画板数) };
				this._画板集.画板集[0] = { 标识: '默认画板', 画板编号: gl.COLOR_ATTACHMENT0 };

				this._序号池 = [];
				for (let i = this._最大画板数 - 1; i >= 1; i--)
					this._序号池.push(i);

				this._编号池 = [];
				for (let i = this._最大画板数 - 1; i >= 1; i--)
					this._编号池.push(gl['COLOR_ATTACHMENT' + i]);

				let 画板 = new 纹理类(this._处理器, null, { 宽: this._绘图区宽, 高: this._绘图区高, 源类型: gl.FLOAT });

				this.添加画板(画板, '默认画板');

				//ext.drawBuffersWEBGL([]);
				//this.启用默认绘图区();

			}
			else {

				if (Object.prototype.toString.apply(标识) == "[object String]") {

					if (标识 === '默认画板') {

						let 画板 = 画板集[0];
						画板.纹理.销毁();
						画板.纹理 = null;
						this.添加画板(new 纹理类(this._处理器, null, { 宽: this._绘图区宽, 高: this._绘图区高, 源类型: gl.FLOAT }), '默认画板');

						是默认 = true;
						已找到 = true;

						console.warn("“默认画板”不能被清除，只能被替换。\n现在已经被替换。");

					}
					else {

						const 序号 = 序号集[标识];
						if (Object.prototype.toString.apply(序号) == "[object Number]" &&
							序号 < 画板集.length && 画板集[序号] &&
							画板集[序号].纹理 instanceof 纹理类) {

							delete 序号集[标识];
							画板集[序号].纹理.销毁();
							顺序 = 画板集[序号].顺序;
							编号 = 画板集[序号].画板编号;
							//this._编号池.push(编号);

							画板集[序号] = undefined;
							this._序号池.push(序号);

							已找到 = true;
							this._画板数--;

						}

					}

				}
				else {

					if (标识 < 画板集.length && 画板集[标识] &&
						画板集[序号].纹理 instanceof 纹理类) {

						if (标识 === 0) {

							画板集[0].纹理.销毁();
							画板集[0].纹理 = null;

							this.添加画板(new 纹理类(处理器, null, { 宽: this._绘图区宽, 高: this._绘图区高, 源类型: gl.FLOAT }), '默认画板');

							是默认 = true;

							console.warn("“默认画板”不能被清除，只能被替换。\n现在已经被替换。");

						}
						else {

							const 记录 = 画板集[标识];

							画板集[标识].纹理.销毁();
							顺序 = 画板集[序号].顺序;
							编号 = 画板集[序号].画板编号;
							//this._编号池.push(编号);

							画板集[标识] = undefined;
							delete 序号集[记录.标识];

							this._序号池.push(标识);
							this._画板数--;
						}

						已找到 = true;

					}

				}

				if (已找到) {

					this.需要刷新 = true;
					//this.刷新画板();
					let 无效目标集 = this._渲染目标序列.无效;
					//目标集.sort((a,b)=>{return a.顺序-b.顺序;});

					//this._渲染目标序列.序列 = 序列;
					if (!是默认)
						if (已启用) {

							gl.framebufferTexture2D(gl.FRAMEBUFFER, 编号, gl.TEXTURE_2D, null, 0);
							//gl.invalidateFramebuffer(gl.FRAMEBUFFER, [编号]);

						}
						else {

							无效目标集.push(编号);

						}

					//}

				}
				else
					console.warn("没有找到要删除的指定纹理：" + 标识);

			}
			//console.log("清除画板。");				
		},

		获取画板: function (标识) {

			const 画板集 = this._画板集.画板集;
			const 序号集 = this._画板集.序号集;

			//const ext = this._WEBGL_draw_buffers;
			const gl = this._处理器.gl;

			if (Object.prototype.toString.apply(标识) == "[object String]") {

				const 序号 = 序号集[标识];
				if (Object.prototype.toString.apply(序号) == "[object Number]" &&
					序号 < 画板集.length && 画板集[序号] &&
					画板集[序号].纹理 instanceof 纹理类) {

					const 记录 = 画板集[序号];
					return { 纹理: 记录.纹理, 序号: 序号, 顺序: 记录.顺序, 画板编号: 记录.画板编号 };

				}

			}
			else {

				if (标识 < 画板集.length && 画板集[标识] &&
					画板集[标识].纹理 instanceof 纹理类) {

					const 记录 = 画板集[标识];
					return { 纹理: 记录.纹理, 序号: 标识, 顺序: 记录.顺序, 画板编号: 记录.画板编号 };

				}
				else {

					//if ( 标识 >= gl.COLOR_ATTACHMENT0 && 标识 <= gl.COLOR_ATTACHMENT15 )
					//return { 纹理: gl.getFramebufferAttachmentParameter( gl.DRAW_FRAMEBUFFER, 标识, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME ), 画板编号: 标识 };
				}

			}

			console.warn("不能找到指定的画板：" + 标识);
			return null;

		},

		获取画板图像: function (标识, 浮点数颜色, 转换为图像) {

			const 处理器 = this._处理器;

			if (!标识) 标识 = '默认画板';
			const 记录 = this.获取画板(标识);
			if (!记录) return null;

			const gl = this._处理器.gl;

			let 当前画板 = 处理器.当前绘图区;


			this.启用();

			//gl.readBuffer(gl['COLOR_ATTACHMENT'+记录.画板编号]);
			gl.readBuffer(记录.画板编号);

			//for(let i=0;i<this._最大画板数;i++)
			//	console.log(gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl['COLOR_ATTACHMENT'+i], gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME),';  i:',i);

			let 宽 = this._绘图区宽;
			let 高 = this._绘图区高;

			let 数据, 类型;

			if (浮点数颜色) {
				数据 = new Float32Array(宽 * 高 * 4);
				类型 = gl.FLOAT;
			}
			else {
				数据 = new Uint8Array(宽 * 高 * 4);
				类型 = gl.UNSIGNED_BYTE;
			}

			gl.readPixels(0, 0, 宽, 高, gl.RGBA, 类型, 数据);

			if (转换为图像) {

				let 图像 = new Uint8ClampedArray(宽 * 高 * 4);

				let 长度 = 数据.length;
				for (let i = 0; i < 长度; i++) 图像[i] = 数据[i] * 255;

				数据 = new ImageData(new Uint8ClampedArray(图像), 宽, 高);
				//console.warn("获取画板图像");	

			}

			if (当前画板)
				处理器.更换绘图区(当前画板.名称)
			else
				处理器.更换绘图区();

			return 数据;

		},

		提取画板: function (标识) {

			const gl = this._处理器.gl;

			if (!标识)
				标识 = ['默认画板']
			else
				if (!(标识 instanceof Array))
					标识 = [标识];

			let 纹理集 = [];
			for (let i = 0, l = 标识.length; i < l; i++)
				纹理集.push(new 纹理类(this._处理器, null, { 宽: this._绘图区宽, 高: this._绘图区高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST }));

			return this.添加画板(纹理集, 标识, true);

		},

		销毁: function () {

			if (this._已销毁) return;

			const 画板集 = this._画板集.画板集;
			for (let i = 0; i < 画板集.length; i++) {
				画板集[i].纹理.销毁();
			}
			帧缓冲销毁数++;
			this._处理器.gl.deleteFramebuffer(this._绘图区);
			this._处理器 = null;
			this._绘图区 = null;
			//this._WEBGL_draw_buffers = null;	
			this._画板集 = null;
			this._序号池 = null;
			this._已销毁 = true;

		},

	}


	var 着色程序信息类 = function (处理器, 顶点着色程序源, 片元着色程序源, 名称) {
		if (!(处理器 instanceof 处理器类)) {
			throw "“处理器”参数无效！";
			return;
		}

		this._处理器 = 处理器;

		this._顶点着色器 = null;
		this._片元着色器 = null;
		this._程序 = null;

		this.名称 = 名称 || "";

		if (顶点着色程序源 && 片元着色程序源)
			this.设置程序(顶点着色程序源, 片元着色程序源);

		this._已销毁 = false;

		//this._本地特性 = {};
		//this._特性缓冲区 = {};

		//this._本地一致变量 = {};	
		//this._一致变量缓冲区 = {};
		//this._缓冲区数 = 0;

		//this._纹理变量 = {};	
		//this._纹理 = {};
		//this._最大纹理数 = this._处理器.gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
		//this._纹理数 = 0;

	}

	着色程序信息类.prototype = {

		get 程序() {
			return this._程序;
		},

		set 程序(程序) {
			console.warn("此属性只读，请使用“设置程序”方法，设置程序。");
		},

		设置程序: function (顶点着色程序源, 片元着色程序源) {

			const gl = this._处理器.gl;

			this._顶点着色器 = 创建着色器(gl, gl.VERTEX_SHADER, 顶点着色程序源);
			this._片元着色器 = 创建着色器(gl, gl.FRAGMENT_SHADER, 片元着色程序源);

			this._程序 = 初始化着色程序(this._处理器.gl, this._顶点着色器, this._片元着色器);

		},

		使用程序: function () {
			const gl = this._处理器.gl;
			const 程序 = this._程序;
			//if (gl.getProgramParameter(程序, gl.ATTACHED_SHADERS)) {
			//	console.error('未能初始化着色程序: ' + gl.getProgramInfoLog(程序));
			//return null;
			//}
			gl.useProgram(程序);
			//if (gl.getProgramParameter(程序, gl.VALIDATE_STATUS)) {
			//	console.error('未能初始化着色程序: ' + gl.getProgramInfoLog(程序));
			//return null;
			//}
		},

		//设置本地特性:  function(特性名, 缓冲区数据, 选项)
		//绑定缓冲区数据到指定的顶点特性（VertexAttrib）。
		//特性名：一个“着色语言（glsl）”支持的字符串。
		//缓冲区数据：一个数组，或类型化数组。
		//选项：一个如下定义的对象，成员可选。
		/*
			var 选项 = {
				
				缓冲区类型: gl.ARRAY_BUFFER || gl.ELEMENT_ARRAY_BUFFER, //传给 gl.bufferData 使用。
				应用类型: gl.STATIC_DRAW || gl.DYNAMIC_DRAW || gl.STREAM_DRAW, //传给 gl.bufferData 使用。
				
				维数: 1 || 2 || 3 || 4, //传入的数据是个几维向量。
				一致化: false || ture, //是否归一化数据。
				间隔: 整数, //读取传入的数据数组时，每隔“间隔”个元素，读取一组数据。
				偏移: 整数, //读取传入的数据数组时，从“偏移”处开始读取。
				
			}
		*/

		设置本地特性: function (特性名, 缓冲区数据, 选项) {

			if (!this._程序) {
				console.warn("请先使用“设置程序”方法，设置程序。");
				return;
			}

			const gl = this._处理器.gl;

			var 接收 = {};

			选项 = 选项 || {};

			const 缓冲区 = 获取缓冲区(gl, 缓冲区数据, 选项.缓冲区类型, 选项.应用类型, 接收);

			if (!缓冲区) {
				console.warn("“缓冲区数据”错误或无效，需要“数组”或“类型化数组”。");
				return;
			}

			/*
			if (特性!=null){
				this._本地特性[特性名] = 特性;
				this._特性缓冲区[特性名] = 缓冲区;
			}
			else{
				this._特性缓冲区["未命名"+this._缓冲区数] = 缓冲区;
			}
			*/

			//this._缓冲区数++;

			switch (选项.缓冲区类型) {

				case gl.ARRAY_BUFFER:
					const 特性 = 获取本地特性(gl, this._程序, 特性名);
					if (特性 != null) {
						const numComponents = 选项.维数 || 4;
						const type = 接收.类型 || gl.FLOAT;
						const normalize = 选项.一致化 || false;
						const stride = 选项.间隔 || 0;
						const offset = 选项.偏移 || 0;
						gl.bindBuffer(gl.ARRAY_BUFFER, 缓冲区);
						gl.vertexAttribPointer(特性, numComponents, type, normalize, stride, offset);
						gl.enableVertexAttribArray(特性);
					}
					break;

				case gl.ELEMENT_ARRAY_BUFFER:
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, 缓冲区);
					break;

			}


		},


		//设置本地一致变量:  function(变量名, 数据, 类型)
		//绑定数据到指定的一致变量（uniform）。
		//变量名：一个“着色语言（glsl）”支持的字符串。
		//数据：一个数值、数组，或类型化数组。
		//类型：一个字符串，是以下值。
		// 		数值：“1i” 整数，“1f” 浮点数；
		//		向量或矩阵：“2i” 二维整形向量、“2f” 二维浮点向量，“2fv” 二阶浮点矩阵，
		//					“3i” 三维整形向量、“3f” 三维浮点向量，“3fv” 三阶浮点矩阵，
		//					“4i” 四维整形向量、“4f” 四维浮点向量，“4fv” 四阶浮点矩阵。

		设置本地一致变量: function (变量名, 数据, 类型) {

			if (!this._程序) {
				console.warn("请先使用“设置程序”方法，设置程序。");
				return;
			}

			const gl = this._处理器.gl;

			数据 = 数据 || 0;

			const 变量 = 获取本地一致变量(gl, this._程序, 变量名);

			/*
			if (变量名!=null){
				this._本地一致变量[变量名] = 变量;
				this._本地一致变量值[变量名] = 数据;
			}
			else{
				console.warn("“变量名”参数错误或无效。");
				return;
			}
			*/

			if (变量名 == null) {
				console.warn("“变量名”参数错误或无效。");
				return;
			}

			类型 = 类型 || "   ";

			if (Object.prototype.toString.apply(数据) == "[object Number]") {
				类型 = 类型.substr(0, 2);
				if (类型 != "1f" && 类型 != "1i") 类型 = "1f";
				gl['uniform' + 类型](变量, 数据);
				return;
			}


			if (数据[0] == undefined) {
				console.warn("“数据”参数错误或无效。");
				//this._本地一致变量[变量名] = null;
				//this._本地一致变量值[变量名] = null;
				return;
			}

			if (数据 instanceof Float32Array || 数据 instanceof Float64Array || 数据 instanceof Array) {
				类型 = 类型.substr(0, 1) + "f" + 类型.substr(2, 1);
			}
			else {
				类型 = 类型.substr(0, 1) + "i" + 类型.substr(2, 1);
			}

			if (类型.substr(2, 1) == 'v') {
				let l = Math.floor(Math.sqrt(数据.length));
				if (l > 4) l = 4;
				if (gl['uniformMatrix' + 类型])
					gl['uniformMatrix' + 类型](变量, false, 数据)
				else
					gl['uniformMatrix' + l + 'fv'](变量, false, 数据);
			}
			else {
				let l = 数据.length;
				if (l > 4) l = 4;
				if (gl['uniform' + 类型])
					gl['uniform' + 类型 + 'v'](变量, 数据)
				else
					gl['uniform' + l + 'fv'](变量, 数据);

			}

		},

		绑定纹理: function (纹理变量名) {

			if (!this._程序) {
				console.warn("请先使用“设置程序”方法，设置程序。");
				return;
			}

			const 处理器 = this._处理器;
			const gl = 处理器.gl;

			const 变量 = 获取本地一致变量(gl, this._程序, 纹理变量名);

			if (!变量) {
				console.warn("指定的纹理变量名：“", 纹理变量名, "”不存在，或不是合法的WebGL GLSL标识符。");
				return;
			}

			const 记录 = 处理器.获取纹理(纹理变量名);
			if (!记录) {
				console.warn("没有找指定的纹理变量名：“", 纹理变量名, "”对应的纹理。");
				return;
			}

			const 纹理 = 记录.纹理;

			this.设置本地一致变量(纹理变量名 + 'Size', [纹理.宽, 纹理.高], '2f');

			//console.log('记录.序号:',记录.序号,'纹理数：',this._处理器.纹理数);

			gl.activeTexture(gl['TEXTURE' + 记录.序号]);
			gl.bindTexture(gl.TEXTURE_2D, 纹理.WEBGL纹理);
			gl.uniform1i(变量, 记录.序号);
			gl.activeTexture(gl.TEXTURE31); //纹理修改使用操作单元，不然会有莫名的错误。
			/*			
			for(let i=0;i<32;i++){
					gl.activeTexture( gl['TEXTURE' + i] );
					let tex = gl.getParameter(gl.TEXTURE_BINDING_2D);
					if (tex)
						console.log(i,':',tex)
					else
						if (i===0) debugger;
				}
				console.log('绑定纹理:  function(');
			*/
		},

		销毁: function () {

			if (this._已销毁) return;

			const gl = this._处理器.gl;

			gl.deleteProgram(this._程序);
			gl.deleteShader(this._顶点着色器);
			gl.deleteShader(this._片元着色器);

			this._顶点着色器 = null;
			this._片元着色器 = null;
			this._程序 = null;
			this._处理器 = null;
			this._已销毁 = true;

		},

	}


	var 图像处理着色程序信息类 = function (处理器, 片元着色程序源, 名称) {

		if (!(处理器 instanceof 处理器类)) {
			throw "“处理器”参数无效！";
			return;
		}

		this.名称 = 名称 || "";

		this._父类 = 着色程序信息类;

		this._顶点着色程序源 = `#version 300 es
				in vec4 aVertexPosition;
				in vec2 aTextureCoord;

				out highp vec2 vTextureCoord;

				void main(void) {
				  gl_Position = aVertexPosition;
				  vTextureCoord = aTextureCoord;
				}
			`;

		this._父类.call(this, 处理器);

		this.设置程序(片元着色程序源);

		this._已销毁 = false;

	}

	图像处理着色程序信息类.prototype = Object.assign(Object.create(着色程序信息类.prototype),
		{

			设置程序: function (片元着色程序源) {

				this._父类.prototype.设置程序.call(this, this._顶点着色程序源, 片元着色程序源);

				const gl = this._处理器.gl;

				this.设置本地特性('aVertexPosition',
					[
						-1.0, 1.0,
						1.0, 1.0,
						-1.0, -1.0,
						1.0, -1.0,
					],
					{
						缓冲区类型: gl.ARRAY_BUFFER,
						应用类型: gl.STATIC_DRAW,
						维数: 2,
					});

				this.设置本地特性('aTextureCoord',
					[
						0.0, 1.0,
						1.0, 1.0,
						0.0, 0.0,
						1.0, 0.0,
					],
					{
						缓冲区类型: gl.ARRAY_BUFFER,
						应用类型: gl.STATIC_DRAW,
						维数: 2,
					});

				this.设置本地特性('indices',
					[
						0, 1, 2,
						3, 1, 2
					],
					{
						缓冲区类型: gl.ELEMENT_ARRAY_BUFFER,
						应用类型: gl.STATIC_DRAW,
					});

			},

			销毁: function () {

				if (this._已销毁) return;

				this._顶点着色程序源 = null;
				this._父类.prototype.销毁.call(this);

				this._已销毁 = true;

			},

		});


	处理程序集.添加程序('高斯模糊', function (图像, 模糊半径, 标准差) {

		var 上次模糊半径 = 0, 上次标准差 = 0;

		const 片元着色程序源 = `#version 300 es
			
			in highp vec2 vTextureCoord;

			uniform sampler2D uToBeProcessedImage;
			uniform highp vec2 uToBeProcessedImageSize;
			
			uniform sampler2D uGaosiMatrix;
			uniform highp vec2 uGaosiMatrixSize;
			
			uniform bool uVertical;
			
			//uniform int DB_default;
			
			out highp vec4 fragColor[4];
			
			void main(void) {
				
				highp vec2 uToBeProcessedImageInterval = 1.0 / uToBeProcessedImageSize;
				
				highp vec2 uGaosiInterval = 1.0 / uGaosiMatrixSize;
				highp vec2 gaosiCoord;
				
				highp float b = 0.0;//调试
				highp int c = 0;//调试
				for ( int i = 0; i < 16384; i++ ){//调试
					
					if ( i >= int( uGaosiMatrixSize.x ) ) break;//调试
					
					gaosiCoord = vec2( i , 0.0 ) - 0.5;//调试
					b += texture( uGaosiMatrix, ( gaosiCoord ) * uGaosiInterval ).r;//调试
					c++;//调试
				}
				
				//fragColor[DB_default] = vec4( 0.5, 0.8, 0.2, 1.0 );//调试
				fragColor[2] = vec4( b, uGaosiMatrixSize, c );//调试
				fragColor[1] = texture( uGaosiMatrix, vTextureCoord )*uGaosiMatrixSize.x*0.2;//调试
				
				highp float uGaosiRadius = ( uGaosiMatrixSize.x - 1.0 ) / 2.0 + 1.0;
				
				for ( int i = 0; i < 16384; i++ ){
					
					if ( i >= int( uGaosiMatrixSize.x ) ) break;
					
					gaosiCoord = vec2( i , 0.0 );
					
					highp vec4 a = texture( uGaosiMatrix, ( gaosiCoord - 0.5 ) * uGaosiInterval );
					if ( uVertical ){
						fragColor[0] += texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, ( float( i ) - uGaosiRadius ) * uToBeProcessedImageInterval.y ) ) * a.r;				
					}
					else{
						fragColor[0] += texture( uToBeProcessedImage, vTextureCoord + vec2( ( float( i ) - uGaosiRadius ) * uToBeProcessedImageInterval.x, 0.0 ) ) * a.r;		
					}
					
				}
				
				//fragColor[2] = fragColor[0];
				//gl_FragColor = texture2D(uToBeProcessedImage, vTextureCoord);//调试
			}
		`;

		return function (图像, 模糊半径, 标准差) {

			let start = window.performance.now();

			图像 = 环境及参数检查(this, 图像);

			var 程序信息 = this._着色程序集.高斯模糊;
			if (!程序信息) 程序信息 = new 图像处理着色程序信息类(this, 片元着色程序源);
			this._着色程序集.高斯模糊 = 程序信息;

			//const wglrc = WebGL2RenderingContext;
			const 绘图区 = this._当前绘图区;

			程序信息.使用程序();

			//console.log(window.performance.now()-start,'const gl = this.gl;');	
			start = window.performance.now();

			var 高斯数列 = this.获取纹理('uGaosiMatrix');

			if ((上次模糊半径 !== 模糊半径) || (上次标准差 !== 标准差) || !高斯数列) {

				上次模糊半径 = 模糊半径;
				上次标准差 = 标准差;
				//模糊半径 = 10;
				高斯数列 = 生成正态分布数列(模糊半径, 标准差);
				高斯数列 = new 纹理类(this, 高斯数列, { 宽: 高斯数列.length, 高: 1, 内部格式: WGLRC.R32F, 源格式: WGLRC.RED, 源类型: WGLRC.FLOAT, 缩小过滤: WGLRC.NEAREST, 放大过滤: WGLRC.NEAREST });
				this.添加纹理(高斯数列, 'uGaosiMatrix');

			}


			//高斯数列 = new Float32Array(高斯数列);
			//console.log('高斯数列:',高斯数列);	
			//let count=0;
			//for(let i=0;i<高斯数列.length;i++) count+=高斯数列[i];
			//console.log('高斯数列:',count);	
			//console.log(window.performance.now()-start,'const 高斯数列 = 生成高斯卷积矩阵( '+模糊半径+' );');	
			//start = window.performance.now();
			//console.log(window.performance.now()-start,'this.载入图像( 高斯矩阵.矩阵,');	
			//start = window.performance.now();

			//debugger;
			//console.log('//横向模糊。');		
			//if (gl.isTexture(图像.WEBGL纹理)) console.log('高斯模糊图像.WEBGL纹理');	
			let 画板;
			if (图像)
				画板 = 图像[0]
			else {
				画板 = 绘图区.提取画板('默认画板');
				//画板 = 绘图区.添加画板(new 纹理类(this, null, {宽: 绘图区.宽, 高: 绘图区.高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST}), '默认画板', true);
				画板 = 画板[0].纹理;
			}

			let 宽 = 画板.宽, 高 = 画板.高;
			{
				//横向模糊。
				if (图像) 绘图区.更改尺寸(宽, 高);
				程序信息.绑定纹理('uGaosiMatrix');  //执行顺序很重要！先要更改绘图区尺寸，再绑定纹理，0号纹理最后绑定！
				this.添加纹理(画板, 'uToBeProcessedImage');
				程序信息.绑定纹理('uToBeProcessedImage');

				//console.log('‘gl.TEXTURE_MAG_FILTER’:',获取WebGL常量名(gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER)),gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER));
				//console.log('‘gl.TEXTURE_MIN_FILTER’:',获取WebGL常量名(gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER)),gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER));
				程序信息.设置本地一致变量('uVertical', 0, '1i');
				//start = window.performance.now();
				this.绘制元素(this._面数 * 3);
				//console.log(window.performance.now()-start);
			}
			//console.log('//纵向模糊。');			
			{
				//纵向模糊。
				画板 = 绘图区.提取画板('默认画板');
				//画板 = 绘图区.添加画板(new 纹理类(this, null, {宽: 宽, 高: 高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST}), '默认画板', true);
				this.添加纹理(画板[0].纹理, 'uToBeProcessedImage');
				程序信息.绑定纹理('uToBeProcessedImage');
				程序信息.设置本地一致变量('uVertical', 1, '1i');
				//start = window.performance.now();
				this.绘制元素(this._面数 * 3);
				//console.log(window.performance.now()-start);
			}

			//if (图像)
			//	return 绘图区.添加画板(new 纹理类(this, null, {宽: this.画布宽, 高: this.画布高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST}), '默认画板', true);
			//else
			//	return null;

		}

		//return this.高斯模糊( 图像, 模糊半径, 标准差 );

	}());

	处理程序集.添加程序('查找边缘', function (图像, 类型, 灰度, 阈值低, 阈值高, 算子类型) {

		const 片元着色程序源 = `#version 300 es
			
			in highp vec2 vTextureCoord;

			uniform sampler2D uToBeProcessedImage;
			uniform highp vec2 uToBeProcessedImageSize;
			
			uniform sampler2D uDirectionImage;
			uniform sampler2D uDirectionImageSize;
			
			uniform highp vec3 uCoreLeft;
			uniform highp vec3 uCoreRight;
			
			uniform highp vec2 uDubbleThreshold;
			
			uniform bool uRestrain;
			uniform bool uGray;
			
			//pi=3.1415926535897932384626433832795;
			const highp float range[8] = float[8](2.748893571891069,
												  1.9634954084936207,
												  1.1780972450961724,
												  0.39269908169872414,
												  -0.39269908169872414,
												  -1.178097245096172,
												  -1.9634954084936211,
												  -2.7488935718910685);
			
			//uniform int DB_default;
			
			out highp vec4 fragColor[4];
			
			void main(void) {
				
				highp vec2 uToBeProcessedImageInterval = 1.0 / uToBeProcessedImageSize;
				
				highp float c;
				highp vec4 Gx, Gy, a11, a12, a13, a21, a22, a23, a31, a32, a33, b22;		
				bool VSampled, HSampled, RLSampled, LRSampled;
				
				//非最大值抑制。
				if ( uRestrain ){
					//灰度模式。
					a22 = texture( uToBeProcessedImage, vTextureCoord );
					
					if ( a22.r < uDubbleThreshold.x ){
						a22.r = 0.0;
					}
					else{
					
						b22 = texture( uDirectionImage, vTextureCoord );
						
						fragColor[1]=(b22+3.14151926)/(3.14151926*2.0);//调试
						//fragColor[1]=vec4(0.0);//调试
						//if ( b22.r <= range[7] || b22.r >= range[0] ) fragColor[1]=vec4(1.0);//调试
						fragColor[1].a=1.0; //调试
						
						if ( ( b22.r <= range[3] && b22.r >= range[4] ) || ( b22.r <= range[7] || b22.r >= range[0] ) ){
							//水平
							a12 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 0.0 ) * uToBeProcessedImageInterval );
							a32 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 0.0 ) * uToBeProcessedImageInterval );
							VSampled = true;
							if ( a22.r < a12.r || a22.r <= a32.r ) a22.r = 0.0;
						}
						else if ( ( b22.r <= range[2] && b22.r >= range[3] ) || ( b22.r <= range[6] && b22.r >= range[7] ) ){
							//右上左下
							a11 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, -1.0 ) * uToBeProcessedImageInterval );
							a33 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 1.0 ) * uToBeProcessedImageInterval );
							RLSampled = true;
							if ( a22.r < a33.r || a22.r <= a11.r ) a22.r = 0.0;
						}
						else if ( ( b22.r <= range[1] && b22.r >= range[2] ) || ( b22.r <= range[5] && b22.r >= range[6] ) ){
							//垂直
							a21 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, -1.0 ) * uToBeProcessedImageInterval );
							a23 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, 1.0 ) * uToBeProcessedImageInterval );
							HSampled = true;
							if ( a22.r < a21.r || a22.r <= a23.r ) a22.r = 0.0;
						}
						else if ( ( b22.r <= range[0] && b22.r >= range[1] ) || ( b22.r <= range[4] && b22.r >= range[5] ) ){
							//左上右下
							a31 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, -1.0 ) * uToBeProcessedImageInterval );
							a13 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 1.0 ) * uToBeProcessedImageInterval );
							LRSampled = true;
							if ( a22.r < a31.r || a22.r <= a13.r ) a22.r = 0.0;
						}
						
						//双阈值。
						if ( a22.r >= uDubbleThreshold.y )
							a22.r = 1.0;
						else if ( a22.r >= uDubbleThreshold.x )
							a22.r = 0.5;
						else
							a22.r = 0.0;
					}
					
					if ( !uGray ){
						//彩色模式。
						
						if ( a22.g < uDubbleThreshold.x ){
							a22.g = 0.0;
						}
						else{
							if ( ( b22.g <= range[3] && b22.g >= range[4] ) || ( b22.g <= range[7] || b22.g >= range[0] ) ){
								//水平
								if (!VSampled){
									a12 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 0.0 ) * uToBeProcessedImageInterval );
									a32 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 0.0 ) * uToBeProcessedImageInterval );
									VSampled = true;
								}
								if ( a22.g < a12.g || a22.g <= a32.g ) a22.g = 0.0;
							}
							else if ( ( b22.g <= range[2] && b22.g >= range[3] ) || ( b22.g <= range[6] && b22.g >= range[7] ) ){
								//右上左下
								if (!RLSampled){
									a11 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, -1.0 ) * uToBeProcessedImageInterval );
									a33 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 1.0 ) * uToBeProcessedImageInterval );
									RLSampled = true;
								}
								if ( a22.g < a33.g || a22.g <= a11.g ) a22.g = 0.0;
							}
							else if ( ( b22.g <= range[1] && b22.g >= range[2] ) || ( b22.g <= range[5] && b22.g >= range[6] ) ){
								//垂直
								if (!HSampled){
									a21 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, -1.0 ) * uToBeProcessedImageInterval );
									a23 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, 1.0 ) * uToBeProcessedImageInterval );
									HSampled = true;
								}
								if ( a22.g < a21.g || a22.g <= a23.g ) a22.g = 0.0;
							}
							else if ( ( b22.g <= range[0] && b22.g >= range[1] ) || ( b22.g <= range[4] && b22.g >= range[5] ) ){
								//左上右下
								if (!LRSampled){
									a31 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, -1.0 ) * uToBeProcessedImageInterval );
									a13 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 1.0 ) * uToBeProcessedImageInterval );
									LRSampled = true;
								}
								if ( a22.g < a31.g || a22.g <= a13.g ) a22.g = 0.0;
							}
							
							//双阈值。
							if ( a22.g >= uDubbleThreshold.y )
								a22.g = 1.0;
							else if ( a22.g >= uDubbleThreshold.x )
								a22.g = 0.5;
							else
								a22.g = 0.0;
						}
					
						if ( a22.b < uDubbleThreshold.x ){
							a22.b = 0.0;
						}
						else{
							if ( ( b22.b <= range[3] && b22.b >= range[4] ) || ( b22.b <= range[7] || b22.b >= range[0] ) ){
								//水平
								if (!VSampled){
									a12 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 0.0 ) * uToBeProcessedImageInterval );
									a32 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 0.0 ) * uToBeProcessedImageInterval );
								}
								if ( a22.b < a12.b || a22.b <= a32.b ) a22.b = 0.0;
							}
							else if ( ( b22.b <= range[2] && b22.b >= range[3] ) || ( b22.b <= range[6] && b22.b >= range[7] ) ){
								//右上左下
								if (!RLSampled){
									a11 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, -1.0 ) * uToBeProcessedImageInterval );
									a33 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 1.0 ) * uToBeProcessedImageInterval );
								}
								if ( a22.b < a33.b || a22.b <= a11.b ) a22.b = 0.0;
							}
							else if ( ( b22.b <= range[1] && b22.b >= range[2] ) || ( b22.b <= range[5] && b22.b >= range[6] ) ){
								//垂直
								if (!HSampled){
									a21 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, -1.0 ) * uToBeProcessedImageInterval );
									a23 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, 1.0 ) * uToBeProcessedImageInterval );
								}
								if ( a22.b < a21.b || a22.b <= a23.b ) a22.b = 0.0;
							}
							else if ( ( b22.b <= range[0] && b22.b >= range[1] ) || ( b22.b <= range[4] && b22.b >= range[5] ) ){
								//左上右下
								if (!LRSampled){
									a31 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, -1.0 ) * uToBeProcessedImageInterval );
									a13 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 1.0 ) * uToBeProcessedImageInterval );
								}
								if ( a22.b < a31.b || a22.b <= a13.b ) a22.b = 0.0;
							}
							
							//双阈值。
							
							if ( a22.b >= uDubbleThreshold.y )
								a22.b = 1.0;
							else if ( a22.b >= uDubbleThreshold.x )
								a22.b = 0.5;
							else
								a22.b = 0.0;
						}
						
						
						
						
						if (a22.r+a22.g+a22.b==0.0)//调试
							fragColor[2]=vec4(0.0,0.0,0.0,1.0);//调试
						else//调试
							fragColor[2] = b22;//调试
					}
					else{
						
						c = b22.r;
						if ( c < 0.0 ) c = 3.1415926535897932384626433832795 + c;
						a22 = vec4( a22.r, b22.r, c, 1.0 );
							
						if (a22.r==0.0){//调试
							//a22 = vec4( 0.0 );
							
							fragColor[2]=vec4(0.0,0.0,0.0,1.0);//调试
						}
						else{//调试
							//c = b22.r;
							//if ( c < 0.0 ) c = 3.159265358 - c;
							//a22 = vec4( a22.r, b22.r, c, 1.0 );
							
							fragColor[2] = b22;//调试
						}
					}
					
					//a22 = vec4( a22.r, b22.r, b22.r, 1.0 );//调试
					fragColor[0] = a22;
					
					fragColor[2] = b22;//调试
					//fragColor[2] = vec4( uRestrain, uDubbleThreshold, fragColor[2].w+5.0 );//调试
				}
				else{
					
					a11 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, -1.0 ) * uToBeProcessedImageInterval );
					a12 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 0.0 ) * uToBeProcessedImageInterval );
					a13 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 1.0 ) * uToBeProcessedImageInterval );
					
					a21 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, -1.0 ) * uToBeProcessedImageInterval );
					
					a23 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, 1.0 ) * uToBeProcessedImageInterval );
					
					a31 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, -1.0 ) * uToBeProcessedImageInterval );
					a32 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 0.0 ) * uToBeProcessedImageInterval );
					a33 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 1.0 ) * uToBeProcessedImageInterval );		
				
					// Scharr算子
					//Gy = a11 * -3.0 + a12 * -10.0 + a13 * -3.0 + a31 * 3.0 + a32 * 10.0 + a33 * 3.0;
					//Gx = a11 * -3.0 + a21 * -10.0 + a31 * -3.0 + a13 * 3.0 + a23 * 10.0 + a33 * 3.0;	
					
					//Sobel算子
					//Gy = a11 * -1.0 + a12 * -2.0 + a13 * -1.0 + a31 * 1.0 + a32 * 2.0 + a33 * 1.0;
					//Gx = a11 * -1.0 + a21 * -2.0 + a31 * -1.0 + a13 * 1.0 + a23 * 2.0 + a33 * 1.0;
					// a13 a23 a33
					// a12 a22 a32
					// a11 a21 a31
					
					Gx = a11 * uCoreLeft.x + a12 * uCoreLeft.y + a13 * uCoreLeft.z + a31 * uCoreRight.x + a32 * uCoreRight.y + a33 * uCoreRight.z;
					Gy = a11 * uCoreLeft.x + a21 * uCoreLeft.y + a31 * uCoreLeft.z + a13 * uCoreRight.x + a23 * uCoreRight.y + a33 * uCoreRight.z;
		
					//fragColor[0] = clamp(sqrt( Gx * Gx + Gy * Gy ), 0.0, 1.0);
					fragColor[0] = sqrt( Gx * Gx + Gy * Gy );
					if ( uGray ){
						a22 = fragColor[0];
						fragColor[0] = vec4(a22.r * 0.299 + a22.g * 0.587 + a22.b * 0.114);
						highp float y = Gy.r * 0.299 + Gy.g * 0.587 + Gy.b * 0.114;
						highp float x = Gx.r * 0.299 + Gx.g * 0.587 + Gx.b * 0.114;
						fragColor[1] = vec4( atan( y, x ) );
						//fragColor[1] = vec4( atan(1.0, 1.0 ), atan(1.0, -1.0 ), atan(-1.0, -1.0 ), atan(-1.0, 1.0 )); //调试
					}
					else{
						fragColor[1] = vec4( atan(Gy.r, Gx.r ), atan(Gy.g, Gx.g ), atan(Gy.b, Gx.b ), 1.0);
					}
					fragColor[2] = fragColor[1];//调试
				}
				
				fragColor[0].w = 1.0;
				
			}
		`;

		return function (图像, 类型, 灰度, 阈值低, 阈值高, 算子类型) {


			图像 = 环境及参数检查(this, 图像);

			var 程序信息 = this._着色程序集.查找边缘;
			if (!程序信息) 程序信息 = new 图像处理着色程序信息类(this, 片元着色程序源);
			this._着色程序集.查找边缘 = 程序信息;

			//const gl = this.gl;
			const 绘图区 = this._当前绘图区;

			程序信息.使用程序();

			let 画板;
			if (图像)
				画板 = 图像[0]
			else {
				画板 = 绘图区.提取画板('默认画板');
				//画板 = 绘图区.添加画板(new 纹理类(this, null, {宽: 绘图区.宽, 高: 绘图区.高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST}), '默认画板', true);
				画板 = 画板[0].纹理;
			}

			let 宽 = 画板.宽, 高 = 画板.高;

			let canny = false;
			let 选项 = { 宽: 宽, 高: 高, 源类型: WGLRC.FLOAT, 多级贴图: false, 缩小过滤: WGLRC.NEAREST, 放大过滤: WGLRC.NEAREST };

			switch (类型) {
				case 'Sobel':
					程序信息.设置本地一致变量('uCoreLeft', [-1, -2, -1], '3f');
					程序信息.设置本地一致变量('uCoreRight', [1, 2, 1], '3f');
					break;

				case 'Scharr':
					程序信息.设置本地一致变量('uCoreLeft', [-3, -10, -3], '3f');
					程序信息.设置本地一致变量('uCoreRight', [3, 10, 3], '3f');
					break;

				case 'Canny':
					if (!(阈值低 > 0)) 阈值低 = 0.25;
					if (!(阈值高 > 0)) 阈值高 = 0.5;

					switch (算子类型) {
						case 'Sobel':
							程序信息.设置本地一致变量('uCoreLeft', [-1, -2, -1], '3f');
							程序信息.设置本地一致变量('uCoreRight', [1, 2, 1], '3f');
							break;

						case 'Scharr':
							程序信息.设置本地一致变量('uCoreLeft', [-3, -10, -3], '3f');
							程序信息.设置本地一致变量('uCoreRight', [3, 10, 3], '3f');
							break;

						default: //默认使用Sobel类型。
							程序信息.设置本地一致变量('uCoreLeft', [-1, -2, -1], '3f');
							程序信息.设置本地一致变量('uCoreRight', [1, 2, 1], '3f');

					}

					绘图区.更改尺寸(宽, 高);
					绘图区.添加画板(new 纹理类(this, null, 选项), 1);
					canny = true;
					break;

				default: //默认使用Sobel类型。
					程序信息.设置本地一致变量('uCoreLeft', [-1, -2, -1], '3f');
					程序信息.设置本地一致变量('uCoreRight', [1, 2, 1], '3f');

			}


			{
				if (灰度)
					程序信息.设置本地一致变量('uGray', 1, '1i')
				else
					程序信息.设置本地一致变量('uGray', 0, '1i');

				程序信息.设置本地一致变量('uRestrain', 0, '1i');
				if (图像) 绘图区.更改尺寸(宽, 高);
				this.添加纹理(画板, 'uToBeProcessedImage');
				程序信息.绑定纹理('uToBeProcessedImage');
				this.绘制元素(this._面数 * 3);
			}

			if (canny) {
				程序信息.设置本地一致变量('uDubbleThreshold', [阈值低, 阈值高], '2f');
				程序信息.设置本地一致变量('uRestrain', 1, '1i');

				let 画板 = 绘图区.提取画板(['默认画板', 1]);
				this.添加纹理(画板[0].纹理, 'uToBeProcessedImage');
				程序信息.绑定纹理('uToBeProcessedImage');
				this.添加纹理(画板[1].纹理, 'uDirectionImage');
				程序信息.绑定纹理('uDirectionImage');
				this.绘制元素(this._面数 * 3);
			}

			//return 绘图区.添加画板(new 纹理类(this, null, {宽: this.画布宽, 高: this.画布高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST}), '默认画板', true);

		}

		//return this.查找边缘( 图像, 类型, 阈值低, 阈值高, 算子类型 );

	}());

	处理程序集.添加程序('霍夫变换', function (图像) {

		const 片元着色程序源 = `#version 300 es
			
			in highp vec2 vTextureCoord;

			uniform sampler2D uToBeProcessedImage;
			uniform highp vec2 uToBeProcessedImageSize;
			uniform bool uGray;
			
			out highp vec4 fragColor[4];
			
			void main(void) {
				
				highp vec2 uToBeProcessedImageInterval = 1.0 / uToBeProcessedImageSize;
				highp vec2 WpH = normalize(uToBeProcessedImageSize), Coord;
				
				highp float c;
				highp vec4 Gx, Gy, a11, a12, a13, a21, a22, a23, a31, a32, a33, b22;		
				
				a11 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, -1.0 ) * uToBeProcessedImageInterval );
				a12 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 0.0 ) * uToBeProcessedImageInterval );
				a13 = texture( uToBeProcessedImage, vTextureCoord + vec2( -1.0, 1.0 ) * uToBeProcessedImageInterval );
				
				a21 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, -1.0 ) * uToBeProcessedImageInterval );
				a22 = texture( uToBeProcessedImage, vTextureCoord );
				a23 = texture( uToBeProcessedImage, vTextureCoord + vec2( 0.0, 1.0 ) * uToBeProcessedImageInterval );
				
				a31 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, -1.0 ) * uToBeProcessedImageInterval );
				a32 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 0.0 ) * uToBeProcessedImageInterval );
				a33 = texture( uToBeProcessedImage, vTextureCoord + vec2( 1.0, 1.0 ) * uToBeProcessedImageInterval );	
				
				//if ( a22.r == 0.0 ) 
				//	fragColor[2] = vec4( 0.0 );
				//else{
					Coord = vTextureCoord;
					c = Coord.x * WpH.x * cos(a22.b) + Coord.y * WpH.y * sin(a22.b);
					fragColor[0] = vec4( a22.r, a22.b, c, 1.0 );
					fragColor[2] = vec4( cos(a22.b) + sin(a22.b), a22.b, c, 1.0 );
				//}

				fragColor[2].a = 1.0;
			}
		`;

		return function (图像) {

			图像 = 环境及参数检查(this, 图像);

			var 程序信息 = this._着色程序集.反相;
			if (!程序信息) 程序信息 = new 图像处理着色程序信息类(this, 片元着色程序源);
			this._着色程序集.反相 = 程序信息;

			const gl = this.gl;
			const 绘图区 = this._当前绘图区;

			程序信息.使用程序();

			let 画板;
			if (图像)
				画板 = 图像[0]
			else {
				画板 = 绘图区.提取画板('默认画板');
				//画板 = 绘图区.添加画板(new 纹理类(this, null, {宽: 绘图区.宽, 高: 绘图区.高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST}), '默认画板', true);
				画板 = 画板[0].纹理;
			}

			let 宽 = 画板.宽, 高 = 画板.高;
			{
				if (图像) 绘图区.更改尺寸(宽, 高);
				this.添加纹理(画板, 'uToBeProcessedImage');
				程序信息.绑定纹理('uToBeProcessedImage');
				this.绘制元素(this._面数 * 3);
			}

		}

	}());


	处理程序集.添加程序('反相', function (图像) {

		const 片元着色程序源 = `#version 300 es
			
			in highp vec2 vTextureCoord;

			uniform sampler2D uToBeProcessedImage;
			
			out highp vec4 fragColor[4];
			
			void main(void) {
	
				fragColor[0] = texture( uToBeProcessedImage, vTextureCoord );
				fragColor[0].rgb = 1.0 - fragColor[0].rgb;
			
			}
		`;

		return function (图像) {

			图像 = 环境及参数检查(this, 图像);

			var 程序信息 = this._着色程序集.反相;
			if (!程序信息) 程序信息 = new 图像处理着色程序信息类(this, 片元着色程序源);
			this._着色程序集.反相 = 程序信息;

			const gl = this.gl;
			const 绘图区 = this._当前绘图区;

			程序信息.使用程序();

			let 画板;
			if (图像)
				画板 = 图像[0]
			else {
				画板 = 绘图区.提取画板('默认画板');
				//画板 = 绘图区.添加画板(new 纹理类(this, null, {宽: 绘图区.宽, 高: 绘图区.高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST}), '默认画板', true);
				画板 = 画板[0].纹理;
			}

			let 宽 = 画板.宽, 高 = 画板.高;
			{
				if (图像) 绘图区.更改尺寸(宽, 高);
				this.添加纹理(画板, 'uToBeProcessedImage');
				程序信息.绑定纹理('uToBeProcessedImage');
				this.绘制元素(this._面数 * 3);
			}

			//return 绘图区.添加画板(new 纹理类(this, null, {宽: this.画布宽, 高: this.画布高, 源类型: gl.FLOAT, 多级贴图: false, 缩小过滤: gl.NEAREST, 放大过滤: gl.NEAREST}), '默认画板', true);

		}

	}());


	function 环境及参数检查(处理器, 图像) {

		if (!(处理器 instanceof 处理器类)) {
			throw "该函数只能作为“处理器类”的方法使用！";
			return;
		}

		if (!(处理器._当前绘图区 instanceof 绘图区类)) {
			throw "该函数需要处理器的“当前绘图区”为“绘图区类”对象！";
			return null;
		}

		if (!图像) return null;

		if (图像 instanceof 纹理类) return [图像];

		if (图像 instanceof Array) {
			let 返回值 = [];
			for (let i = 0, l = 图像.length; i < l; i++) {
				let 纹理 = 图像[i]
				if (纹理 instanceof 纹理类)
					返回值.push(纹理);
			}
			if (返回值.length) return 返回值;

			return null;
		}

		图像 = 处理器.获取纹理(图像);
		if (图像) return [图像.纹理];

		return null;

	}


	function 初始化WebGL(canvas, Context, Attributes) {

		canvas = (Object.prototype.toString.apply(canvas) == "[object HTMLCanvasElement]") ? canvas : document.createElement('canvas');

		var gl = null;
		try {
			gl = canvas.getContext(Context, Attributes);
		}
		catch (e) {
			console.error("WebGL初始化失败，" + e + "。");
			return null;
		}

		return gl;
	}


	//
	// creates a shader of the given type, uploads the source and compiles it.
	//创建指定类型的着色器，并编译提供的源程序。
	//

	function 创建着色器(gl, 类型, 源) {


		const 着色器 = gl.createShader(类型);

		// 提供源程序给着色器对象

		gl.shaderSource(着色器, 源);

		// 编译着色器程序

		gl.compileShader(着色器);

		// 查看着色器是否编译成功

		if (!gl.getShaderParameter(着色器, gl.COMPILE_STATUS)) {
			console.error('编译着色器程序时发生一个错误: ', gl.getShaderInfoLog(着色器));
			gl.deleteShader(着色器);

			if (Object.prototype.toString.apply(源) === "[object String]") {

				var 数组 = 源.split('\n');
				var 串 = '';
				for (let i = 0; i < 数组.length; i++) {
					let 行 = 数组[i];
					串 += ((i + 1) + '、' + 行 + '\n');
				}

				console.error(串);

			}

			return null;
		}

		return 着色器;
	}

	function 获取本地特性(gl, 着色器程序, 特性名) {

		const 特性 = gl.getAttribLocation(着色器程序, 特性名);

		if (特性 === -1) {
			console.warn('不能获取本地特性: ' + 特性名);
			return null;
		}

		return 特性;
	}

	function 获取本地一致变量(gl, 着色器程序, 变量名) {

		const 变量 = gl.getUniformLocation(着色器程序, 变量名);

		if (变量 === -1) {
			console.warn('不能获取本地特性: ' + 变量名);
			return null;
		}

		return 变量;
	}


	//	
	// Initialize a shader program, so WebGL knows how to draw our data
	// 初始化着色程序，以便 WebGL 知道如何绘制数据。
	//

	function 初始化着色程序(gl, 顶点着色源程序, 片元着色源程序) {

		var 顶点着色器, 片元着色器;
		if (顶点着色源程序 instanceof WebGLShader) {
			顶点着色器 = 顶点着色源程序;
		}
		else {
			顶点着色器 = 创建着色器(gl, gl.VERTEX_SHADER, 顶点着色源程序);
			if (!(顶点着色器 instanceof WebGLShader)) {
				console.error('未能初始化着色程序，“顶点着色源程序”参数错误或无效！');
				return null;
			}
		}

		if (片元着色源程序 instanceof WebGLShader) {
			片元着色器 = 片元着色源程序;
		}
		else {
			片元着色器 = 创建着色器(gl, gl.FRAGMENT_SHADER, 片元着色源程序);
			if (!(片元着色器 instanceof WebGLShader)) {
				console.error('未能初始化着色程序，“片元着色源程序”参数错误或无效！');
				return null;
			}
		}

		// 创建着色程序

		const 着色程序 = gl.createProgram();
		gl.attachShader(着色程序, 顶点着色器);
		gl.attachShader(着色程序, 片元着色器);
		gl.linkProgram(着色程序);

		// 如果创建着色程序失败，显示错误提示

		if (!gl.getProgramParameter(着色程序, gl.LINK_STATUS)) {
			console.error('未能初始化着色程序: ' + gl.getProgramInfoLog(着色程序));
			return null;
		}

		return 着色程序;
	}


	function 载入WEBGL纹理(gl, 数据, 完成回调, 选项, WEBGL纹理) {

		if (Object.prototype.toString.apply(选项) != "[object Object]") 选项 = {};

		// Because images have to be download over the internet
		// they might take a moment until they are ready.
		// Until then put a single pixel in the texture so we can
		// use it immediately. When the image has finished downloading
		// we'll update the texture with the contents of the image.
		const level = 选项.级别 || 0;
		var width = 选项.宽 || 1;
		var height = 选项.高 || 1;
		const border = 选项.边框 || 0;
		const mipmap = 选项.多级贴图 || true;
		const warpS = 选项.横向折回 || gl.REPEAT;
		const warpT = 选项.纵向折回 || gl.REPEAT;
		const minFilter = 选项.缩小过滤 || gl.LINEAR;
		const magFilter = 选项.放大过滤 || gl.LINEAR;

		var internalFormat = 选项.内部格式 || gl.RGBA;
		var srcFormat = 选项.源格式 || gl.RGBA;
		var srcType = 选项.源类型 || gl.UNSIGNED_BYTE;

		//匹配WebGL内部格式与源格式(WebGL2RenderingContext.RGBA_INTEGER);
		let 接收 = {};
		if (!WebGL内部格式与源格式匹配检测(internalFormat, srcFormat, srcType, 2, 接收)) {
			let 匹配 = 接收.匹配[0];
			internalFormat = 匹配[0];
			srcFormat = 匹配[1];
			srcType = 匹配[2];
		}

		var 纹理;
		if (WEBGL纹理 instanceof WebGLTexture)
			纹理 = WEBGL纹理;
		else {
			纹理 = gl.createTexture();
			//console.log('纹理 = gl.createTexture();');
			纹理创建数++;
		}
		gl.bindTexture(gl.TEXTURE_2D, 纹理);

		if (Object.prototype.toString.apply(数据) == "[object String]") {

			var pixel = null;//new Uint8Array([0, 0, 255, 255]);  // 图片没加载前，使用蓝色背景。
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
				width, height, border, srcFormat, srcType,
				pixel);

			const image = new Image();
			image.addEventListener('load', function (event) {

				let width = image.width, height = image.height;

				gl.bindTexture(gl.TEXTURE_2D, 纹理);
				gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
					srcFormat, srcType, image);

				// WebGL1 has different requirements for power of 2 images
				// vs non power of 2 images so check if the image is a
				// power of 2 in both dimensions.
				if (isPowerOf2(width) && isPowerOf2(height)) {
					// Yes, it's a power of 2. Generate mips.
					选项.多级贴图 && image && gl.generateMipmap(gl.TEXTURE_2D);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, 选项.横向折回);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, 选项.纵向折回);

				} else {
					// No, it's not a power of 2. Turn of mips and set
					// wrapping to clamp to edge
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

					if (选项.缩小过滤 !== gl.LINEAR && 选项.缩小过滤 !== gl.NEAREST) 选项.缩小过滤 = gl.LINEAR;
				}

				//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 选项.缩小过滤);
				//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, 选项.放大过滤);

				console.log("纹理载入完成。");
				Object.prototype.toString.apply(完成回调) == "[object Function]" && 完成回调(纹理, width, height);

			}, false);
			image.src = 数据;
		}
		else {

			if (数据 instanceof HTMLImageElement || 数据 instanceof HTMLCanvasElement || 数据 instanceof HTMLVideoElement ||
				数据 instanceof ImageBitmap || 数据 instanceof ImageData) {

				width = 数据.width;
				height = 数据.height;

				gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, 数据);

			}
			else {

				var pixel;
				if (!数据 || (数据 && 数据[0] == undefined))
					pixel = null
				else {

					pixel = new Uint16Array(数据);

					switch (srcType) {

						case gl.HALF_FLOAT: pixel = new Uint16Array(数据);
							break;

						case gl.FLOAT: pixel = new Float32Array(数据);
							break;

						case gl.INT: pixel = new Int32Array(数据);
							break;

						case gl.UNSIGNED_INT: pixel = new Uint32Array(数据);
							break;

						case gl.BYTE: pixel = new Int8Array(数据);
							break;

						case gl.UNSIGNED_BYTE: pixel = new Uint8Array(数据);
							break;

						case gl.SHORT: pixel = new Int16Array(数据);
							break;

						case gl.UNSIGNED_SHORT: pixel = new Uint16Array(数据);
							break;

						case gl.UNSIGNED_SHORT_5_6_5: pixel = new Uint16Array(数据);
							break;

						case gl.UNSIGNED_SHORT_4_4_4_4: pixel = new Uint16Array(数据);
							break;

						case gl.UNSIGNED_SHORT_5_5_5_1: pixel = new Uint16Array(数据);
							break;

						case gl.UNSIGNED_SHORT: pixel = new Uint16Array(数据);
							break;

						case gl.UNSIGNED_INT_2_10_10_10_REV: pixel = new Uint32Array(数据);
							break;

						case gl.UNSIGNED_INT_10F_11F_11F_REV: pixel = new Uint32Array(数据);
							break;

						case gl.UNSIGNED_INT_5_9_9_9_REV: pixel = new Uint32Array(数据);
							break;

						case gl.UNSIGNED_INT_24_8: pixel = new Uint32Array(数据);
							break;

						case gl.FLOAT_32_UNSIGNED_INT_24_8_REV: pixel = null;
							break;
					}

				}

				gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					width, height, border, srcFormat, srcType,
					pixel);

			}


			if (isPowerOf2(width) && isPowerOf2(height)) {
				// Yes, it's a power of 2. Generate mips.
				选项.多级贴图 && pixel && gl.generateMipmap(gl.TEXTURE_2D);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, 选项.横向折回);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, 选项.纵向折回);

			}
			else {
				// No, it's not a power of 2. Turn of mips and set
				// wrapping to clamp to edge
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			}

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 选项.缩小过滤);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, 选项.放大过滤);


			//console.log("纹理载入完成。");

			Object.prototype.toString.apply(完成回调) == "[object Function]" && 完成回调(纹理, width, height);

		}

		return 纹理;
	}


	function isPowerOf2(value) {
		return (value & (value - 1)) == 0;
	}

	function isPowerOf2(value) {
		return (value & (value - 1)) == 0;
	}

	//console.log(WebGL内部格式与源格式匹配检测(WebGL2RenderingContext.RGB,WebGL2RenderingContext.RGBA,null,1));

	function WebGL内部格式与源格式匹配检测(内部格式, 源格式, 源类型, 基准, 回传) {

		let 参数 = [];
		if (内部格式) 参数.push({ 数据: 内部格式, 格式: '内部格式', 索引: 0 });
		if (源格式) 参数.push({ 数据: 源格式, 格式: '源格式', 索引: 1 });
		if (源类型) 参数.push({ 数据: 源类型, 格式: '源类型', 索引: 2 });

		if (参数.length < 2) return false;

		if (!(基准 >= 0))
			基准 = 0
		else
			if (基准 > 参数.length - 1)
				基准 = 参数.length - 1;

		基准 = 参数[基准];
		let 匹配 = 匹配WebGL内部格式与源格式(基准.数据)[基准.格式];
		if (匹配) {
			for (let i = 0; i < 匹配.length; i++) {
				let 组合 = 匹配[i];
				let 中断 = false;
				for (let j = 0; j < 参数.length; j++) {
					let 元素 = 参数[j]
					if (元素.数据 !== 组合[元素.索引]) {
						中断 = true;
						break;
					}
				}

				if (!中断) return true;
			}
		}

		if (Object.prototype.toString.apply(回传) == "[object Object]") 回传.匹配 = 匹配;
		return false;

	};

	//function 匹配WebGL内部格式与源格式(像素格式或数据类型)
	//返回一个WebGL内部格式、源格式与源类型的组合供texImage2D的“internalFormat”、“format”与“type”参数使用。
	//像素格式或数据类型：为一个WebGL像素格式或数据类型常量。
	//返回值：如果匹配成功则返回一个对象，包含如下结构中的至少一个成员：
	/*
		var WebGL内部格式与源格式组合={
				内部格式: [[internalFormat, format, type],[internalFormat, format, type], ...],
				源格式: [[internalFormat, format, type],[internalFormat, format, type], ...],
				源类型: [[internalFormat, format, type],[internalFormat, format, type], ...],
		}
	*/
	//匹配失败则返回一个空对象。

	function 匹配WebGL内部格式与源格式(像素格式或数据类型) {
		{
			var 格式组合字符串 = `
				@RGB	RGB	UNSIGNED_BYTE@
				@		UNSIGNED_SHORT_5_6_5@
				@RGBA	RGBA	UNSIGNED_BYTE@
				@		UNSIGNED_SHORT_4_4_4_4@
				@		UNSIGNED_SHORT_5_5_5_1@
				@LUMINANCE_ALPHA	LUMINANCE_ALPHA	UNSIGNED_BYTE@
				@LUMINANCE	LUMINANCE	UNSIGNED_BYTE@
				@ALPHA	ALPHA	UNSIGNED_BYTE@
				@R8	RED	UNSIGNED_BYTE@
				@R16F	RED	HALF_FLOAT@
				@		FLOAT@
				@R32F	RED	FLOAT@
				@R8UI	RED_INTEGER	UNSIGNED_BYTE@
				@RG8	RG	UNSIGNED_BYTE@
				@RG16F	RG	HALF_FLOAT@
				@		FLOAT@
				@RG32F	RG	FLOAT@
				@RG8UI	RG_INTEGER	UNSIGNED_BYTE@
				@RGB8	RGB	UNSIGNED_BYTE@
				@SRGB8	RGB	UNSIGNED_BYTE@
				@RGB565	RGB	UNSIGNED_BYTE@
				@		UNSIGNED_SHORT_5_6_5@
				@R11F_G11F_B10F	RGB	UNSIGNED_INT_10F_11F_11F_REV@
				@		HALF_FLOAT@
				@		FLOAT@
				@RGB9_E5	RGB	HALF_FLOAT@
				@		FLOAT@
				@RGB16F	RGB	HALF_FLOAT@
				@		FLOAT@
				@RGB32F	RGB	FLOAT@
				@RGB8UI	RGB_INTEGER	UNSIGNED_BYTE@
				@RGBA8	RGBA	UNSIGNED_BYTE@
				@SRGB8_ALPHA8	RGBA	UNSIGNED_BYTE@
				@RGB5_A1	RGBA	UNSIGNED_BYTE@
				@		UNSIGNED_SHORT_5_5_5_1@
				@RGB10_A2	RGBA	UNSIGNED_INT_2_10_10_10_REV@
				@RGBA4	RGBA	UNSIGNED_BYTE@
				@		UNSIGNED_SHORT_4_4_4_4@
				@RGBA16F	RGBA	HALF_FLOAT@
				@		FLOAT@
				@RGBA32F	RGBA	FLOAT@
				@RGBA8UI	RGBA_INTEGER	UNSIGNED_BYTE@
			`;

			let 格式组合数组 = 格式组合字符串.split('\n');
			let internalFormat = 0, format = 0, type = 0;
			var 内部格式 = {}, 源格式 = {}, 源类型 = {};
			for (let i = 0; i < 格式组合数组.length; i++) {
				let 格式组合 = 格式组合数组[i].split('@');
				if (格式组合.length > 1)
					格式组合 = 格式组合[1].split('	')
				else
					格式组合 = [];

				if (格式组合.length === 3) {
					let 格式 = 格式组合[0];
					if (格式) internalFormat = WGLRC[格式];
					格式 = 格式组合[1];
					if (格式) format = WGLRC[格式];
					格式 = 格式组合[2];
					if (格式) type = WGLRC[格式];

					if (internalFormat) {
						if (内部格式[internalFormat])
							内部格式[internalFormat].push([internalFormat, format, type])
						else
							内部格式[internalFormat] = [[internalFormat, format, type]];
					}
					//else debugger;

					if (format) {
						if (源格式[format])
							源格式[format].push([internalFormat, format, type])
						else
							源格式[format] = [[internalFormat, format, type]];
					}
					//else debugger;

					if (type) {
						if (源类型[type])
							源类型[type].push([internalFormat, format, type])
						else
							源类型[type] = [[internalFormat, format, type]];
					}
					//else debugger;
				}
			}
		}

		匹配WebGL内部格式与源格式 = function (WebGL像素格式或数据类型) {

			let A = 内部格式[WebGL像素格式或数据类型], B = 源格式[WebGL像素格式或数据类型], C = 源类型[WebGL像素格式或数据类型];
			let a = [], b = [], c = [];

			if (A)
				for (let i = 0; i < A.length; i++) {
					let T = A[i];
					a.push([T[0], T[1], T[2]]);
				}

			if (B)
				for (let i = 0; i < B.length; i++) {
					let T = B[i];
					b.push([T[0], T[1], T[2]]);
				}

			if (C)
				for (let i = 0; i < C.length; i++) {
					let T = C[i];
					c.push([T[0], T[1], T[2]]);
				}

			let re = {};
			if (a.length) re.内部格式 = a;
			if (b.length) re.源格式 = b;
			if (c.length) re.源类型 = c;

			return re;

		}

		return 匹配WebGL内部格式与源格式(像素格式或数据类型);

	}

	function 获取WebGL常量名(常量) {
		var WebGL常量 = {};
		var keys = Object.keys(WGLRC);
		for (let i = 0, l = keys.length; i < l; i++) {
			let 常量 = WGLRC[keys[i]];
			if (Object.prototype.toString.apply(常量) == "[object Number]")
				WebGL常量[常量] = keys[i];
		}

		获取WebGL常量名 = function (常量) {
			let 名称 = WebGL常量[常量];
			if (名称 !== undefined)
				return 名称;
			console.warn('没有找到常量：“', 常量, '”对应的常量名。');
			return null;
		}
		return 获取WebGL常量名(常量);
	}


	function 获取缓冲区(gl, 缓冲区数据, 缓冲区类型, 应用类型, 返回值) {
		//if (!(gl || 缓冲区数据)) return null;
		//if (!(gl instanceof WebGL2RenderingContext)) throw "非“WebGL2RenderingContext”对象！";

		缓冲区类型 = 缓冲区类型 || gl.ARRAY_BUFFER;
		应用类型 = 应用类型 || gl.STATIC_DRAW;

		const buffer = gl.createBuffer();
		gl.bindBuffer(缓冲区类型, buffer);
		返回值 = 返回值 || {};

		返回值.类型 = 类型化数组对应GL类型[Object.prototype.toString.apply(缓冲区数据)];

		switch (缓冲区类型) {
			case gl.ARRAY_BUFFER:
				(返回值.类型 === undefined) && (缓冲区数据 = new Float32Array(缓冲区数据));
				gl.bufferData(缓冲区类型, 缓冲区数据, 应用类型);
				break;
			case gl.ELEMENT_ARRAY_BUFFER:
				gl.bufferData(缓冲区类型, new Uint16Array(缓冲区数据), 应用类型);
				break;
		}

		return buffer;
	}


	//var 一维正态分布=1/(sigema*Math.sqrt(Math.PI*2))*Math.exp(-(x-miu)*(x-miu)/(2*sigema*sigema));
	//var 二维正态分布=1/(sigema*sigema*Math.PI*2)*Math.exp(-(x*x+y*y)/(2*sigema*sigema));
	//其中，平均值为0。

	//var 二维标准正态分布=1/(Math.PI*2)*Math.exp(-(x*x+y*y)/2);

	//var 二维带系数标准正态分布=1/(Math.PI*2)*Math.exp(-k*k*(x*x+y*y)/2);
	//当k为1时，只要其分布概率小于0.039894228，则记为0，此时对应的半径（即x为0时的y值，或y为0时的x值）约为2。
	//以此为标准，当指定半径r时，便可以求出k值：k=sqrt(4/(r*r))。
	function 生成高斯卷积矩阵(半径) {

		半径 = 半径 || 1;

		const sigema = 1;
		const sigemaXsigema = sigema * sigema;

		if (!半径 >= 0.2) 半径 = 0.2; //半径最小为0.2。
		const kxk = 4.5 / (半径 * 半径);
		半径 = Math.ceil(半径);
		const 边 = 半径 * 2 + 1;

		//计算矩阵。
		const 长度 = 边 * 边;
		var 矩阵 = Array(长度);

		var g = 1 / (sigemaXsigema * Math.PI * 2) * Math.exp(0);
		矩阵[半径 * 边 + 半径] = g;

		var 和 = g;

		for (let i = 0; i < 半径; i++) {
			let y = 半径 - i;
			let yxy = y * y;
			for (let j = 0; j < 半径; j++) {
				let x = 半径 - j;
				let G = 1 / (sigemaXsigema * Math.PI * 2) * Math.exp(-kxk * (x * x + yxy) / (2 * sigemaXsigema));
				矩阵[i * 边 + j] = G;
				矩阵[i * 边 + 2 * 半径 - j] = G;
				矩阵[(2 * 半径 - i) * 边 + j] = G;
				矩阵[(2 * 半径 - i) * 边 + 2 * 半径 - j] = G;
				和 += 4 * G;
			}
		}

		for (let i = 0; i < 半径; i++) {
			let y = 半径 - i;
			let G = 1 / (sigemaXsigema * Math.PI * 2) * Math.exp(-kxk * y * y / (2 * sigemaXsigema));
			矩阵[i * 边 + 半径] = G;
			矩阵[半径 * 边 + 2 * 半径 - i] = G;
			矩阵[半径 * 边 + i] = G;
			矩阵[(2 * 半径 - i) * 边 + 半径] = G;
			和 += 4 * G;
		}

		//归一化。
		//for(let i=0;i<长度;i++) 和+=矩阵[i];
		for (let i = 0; i < 长度; i++) 矩阵[i] /= 和;

		return { 矩阵: 矩阵, 边长: 边 };

	}


	function 生成正态分布数列(半径, 标准差, 平均值) {

		半径 = 半径 || 1;
		平均值 = 平均值 || 0;
		标准差 = 标准差 || 半径 / 3;

		const sigema = 标准差;
		半径 *= 3;
		const sigemaXsigemaX2 = sigema * sigema * 2;
		const sigemaXsigemaX2Pre = -1 / sigemaXsigemaX2;
		const m = 1 / (sigema * Math.sqrt(Math.PI * 2));

		// 计算数列。

		var G = m * Math.exp(平均值 * 平均值 * sigemaXsigemaX2Pre);

		if (!(半径 >= 0.1)) 半径 = 0.1; //半径最小为0.1。

		半径 = Math.ceil(半径);
		const 长 = 半径 * 2 + 1;

		var 数列 = Array(长);

		数列[半径] = G;

		var 和 = G;

		for (let i = 0; i < 半径; i++) {
			let x = (i + 1) - 平均值;
			let g = m * Math.exp(x * x * sigemaXsigemaX2Pre);
			和 += g * 2;
			数列[半径 + 1 + i] = g;
			数列[半径 - i - 1] = g;
		}

		//归一化。·
		for (let i = 0; i < 长; i++) 数列[i] /= 和;

		return 数列;

	}

	function 高斯模糊(图片, 模糊半径) {

		if (!(图片 instanceof ImageData)) {
			console.warn('“图像”参数必须是“ImageData”对象！');
			return false;
		}

		let 宽 = 图片.width;
		let 高 = 图片.height;
		let 高斯数列 = 生成正态分布数列(模糊半径);
		let 数据 = new Uint8ClampedArray(宽 * 高 * 4);
		let 临时图像 = 图片.data;
		let 半径 = (高斯数列.length - 1) / 2;
		let b = 高斯数列[半径];

		//水平模糊
		for (let j = 0; j < 高; j++) {
			let d = j * 宽;
			for (let i = 0; i < 宽; i++) {
				let a = (d + i) * 4;
				let a0 = a;
				数据[a] = 临时图像[a] * b;
				a++;
				let a1 = a;
				数据[a] = 临时图像[a] * b;
				a++;
				let a2 = a;
				数据[a] = 临时图像[a] * b;
				a++;
				let a3 = a;
				数据[a] = 临时图像[a] * b;
				for (let k = 0; k < 半径; k++) {
					let w = 半径 - k;
					let w0 = i - w;
					let w1 = i + w;
					if (w0 < 0) w0 = 0;
					if (w1 >= 宽) w1 = 宽 - 1;
					w0 = (d + w0) * 4;
					w1 = (d + w1) * 4;
					let c = 高斯数列[k];
					数据[a0] += 临时图像[w0] * c;
					数据[a0] += 临时图像[w1] * c;
					w0++;
					w1++;
					数据[a1] += 临时图像[w0] * c;
					数据[a1] += 临时图像[w1] * c;
					w0++;
					w1++;
					数据[a2] += 临时图像[w0] * c;
					数据[a2] += 临时图像[w1] * c;
					w0++;
					w1++;
					数据[a3] += 临时图像[w0] * c;
					数据[a3] += 临时图像[w1] * c;
				}
			}
		}

		//垂直模糊
		临时图像 = 数据;
		数据 = new Uint8ClampedArray(宽 * 高 * 4);
		for (let j = 0; j < 高; j++) {
			let d = j * 宽;
			for (let i = 0; i < 宽; i++) {
				let a = (d + i) * 4;
				let a0 = a;
				数据[a] = 临时图像[a] * b;
				a++;
				let a1 = a;
				数据[a] = 临时图像[a] * b;
				a++;
				let a2 = a;
				数据[a] = 临时图像[a] * b;
				a++;
				let a3 = a;
				数据[a] = 临时图像[a] * b;
				for (let k = 0; k < 半径; k++) {
					let w = 半径 - k;
					let w0 = j - w;
					let w1 = j + w;
					if (w0 < 0) w0 = 0;
					if (w1 >= 高) w1 = 高 - 1;
					w0 = (w0 * 宽 + i) * 4;
					w1 = (w1 * 宽 + i) * 4;
					let c = 高斯数列[k];
					数据[a0] += 临时图像[w0] * c;
					数据[a0] += 临时图像[w1] * c;
					w0++;
					w1++;
					数据[a1] += 临时图像[w0] * c;
					数据[a1] += 临时图像[w1] * c;
					w0++;
					w1++;
					数据[a2] += 临时图像[w0] * c;
					数据[a2] += 临时图像[w1] * c;
					w0++;
					w1++;
					数据[a3] += 临时图像[w0] * c;
					数据[a3] += 临时图像[w1] * c;
				}
			}
		}

		return new ImageData(数据, 宽, 高);

	}


	var 处理器;

	function 高斯模糊GPU(图片, 模糊半径, 完成回调) {

		if (处理器 instanceof 处理器类) 处理器.销毁();

		处理器 = new 处理器类(显示画布, 'webgl2');

		处理器.添加绘图区('图像处理区域');

		处理器.获取绘图区('图像处理区域').添加画板(new 纹理类(处理器, null, { 宽: 处理器.画布宽, 高: 处理器.画布高 }), '第二块');
		处理器.获取绘图区('图像处理区域').添加画板(new 纹理类(处理器, null, { 宽: 处理器.画布宽, 高: 处理器.画布高 }), '第三块');
		处理器.获取绘图区('图像处理区域').添加画板(new 纹理类(处理器, null, { 宽: 处理器.画布宽, 高: 处理器.画布高 }), '第四块');

		//处理器.准备图像(图片, 'uToBeProcessedImage');//uToBeProcessedImage
		处理器.准备图像(图片, '待处理图像');

		处理器.设置处理线([
			[处理程序集.获取程序('高斯模糊'), ['待处理图像', 2]],
			//[ 处理程序集.获取程序('查找边缘'),[ '待处理图像', 'Sobel' ] ],
			//[ 处理程序集.获取程序('高斯模糊'),[ '待处理图像', 2 ] ], 
			[处理程序集.获取程序('查找边缘'), ['待处理图像', 'Canny', true, 0.1, 0.5]],//Canny Scharr
			//[处理程序集.获取程序('霍夫变换'), ['待处理图像']],
			//[ 处理程序集.获取程序('查找边缘'),[ '待处理图像', 'Canny', true, 0.1, 0.4 ] ],
			//[ 处理程序集.获取程序('反相'),[ '待处理图像' ] ], 
			//[ 处理程序集.获取程序('查找边缘'),[ '待处理图像', 'Sobel' ] ],
		]);

		//处理器.设置处理程序( 处理程序集.获取程序('高斯模糊'), [ '待处理图像', 模糊半径 ] );

		//处理器.设置处理程序( 处理程序集.获取程序('查找边缘'), [ '待处理图像', 模糊半径, 5 ] );

		处理器.更换绘图区('图像处理区域', true);

		处理器.获取绘图区('图像处理区域').清除画板('第二块');
		处理器.获取绘图区('图像处理区域').添加画板(new 纹理类(处理器, null, { 宽: 处理器.画布宽, 高: 处理器.画布高 }), '第二块');

		处理器.设置完成回调(完成回调, [
			(标识, 浮点数颜色, 转换为图像) => {
				处理器.显示到画布();
				return 处理器.获取绘图区('图像处理区域').获取画板图像(标识, 浮点数颜色, 转换为图像)
			}]);

		处理器.启动();
		处理器.启动处理线();
		var a = 100;
		处理.处理 = (图片) => {

			a += 0.01;
			if (a > 100) {
				a = 0;
				处理器.准备图像(图片, '待处理图像');
				处理器.设置处理线([
					//[ 处理程序集.获取程序('高斯模糊'),[ '待处理图像', 2 ] ], 
					[处理程序集.获取程序('查找边缘'), ['待处理图像', 'Sobel']],
					//[ 处理程序集.获取程序('查找边缘'),[ '待处理图像', 'Canny', true, a, a ] ],//Canny Scharr
					//[ 处理程序集.获取程序('反相'),[ '待处理图像' ] ], 
					//[ 处理程序集.获取程序('查找边缘'),[ '待处理图像', 模糊半径 ] ],
				]);
			}
			else
				处理器.设置处理线([
					//[ 处理程序集.获取程序('高斯模糊'),[ '', 2 ] ], 
					//[处理程序集.获取程序('查找边缘'), ['', 'Sobel']],
					[处理程序集.获取程序('查找边缘'), ['', 'Sobel']],
					//[处理程序集.获取程序('查找边缘'),[ '', 'Canny', true, a, a ]],//Canny
					[处理程序集.获取程序('霍夫变换'), ['']],
					//[ 处理程序集.获取程序('反相'),[ '' ] ], 
					//[ 处理程序集.获取程序('查找边缘'),[ '', 模糊半径 ] ],
				]);


			处理器.启动处理线();

		};

		处理.绘制 = (完成回调) => {
			处理器.显示到画布();
			Object.prototype.toString.apply(完成回调) == "[object Function]" &&
				完成回调((标识, 浮点数颜色, 转换为图像) => {
					//return 处理器.获取绘图区('图像处理区域').获取画板图像(标识, 浮点数颜色, 转换为图像)
				});
		};

		//处理器.销毁();

	}

	处理.处理 = () => { };

	处理.运行 = (图像路径, 完成回调) => {
		高斯模糊GPU(图像路径, 15, 完成回调);
	};

	处理.高斯模糊=高斯模糊;

	return 处理;

})();





