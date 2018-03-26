(function(){
	
	var 处理={};
	
	var G图像='图像处理/跳一跳.png';
	
	var 高斯半径=5;
	
	var 处理程序集={};
	
	var 类型化数组对应GL类型={};
	
		//gl.FLOAT
		
		类型化数组对应GL类型["[object Float32Array]"] = 5126;

		//gl.UNSIGNED_SHORT

		类型化数组对应GL类型["[object Uint16Array]"] = 5123;

		//gl.SHORT

		类型化数组对应GL类型["[object Int16Array]"] = 5122;

		//gl.UNSIGNED_INT

		类型化数组对应GL类型["[object Uint32Array]"] = 5125;

		//gl.INT

		类型化数组对应GL类型["[object Int32Array]"] = 5124;

		//gl.BYTE

		类型化数组对应GL类型["[object Int8Array]"] = 5120;

		//gl.UNSIGNED_BYTE

		类型化数组对应GL类型["[object Uint8Array]"] = 5121;
		
	
	//debugger;

	
	var 处理器类=function(画布, 上下文, 名称){
		
		画布=(Object.prototype.toString.apply(画布)=="[object HTMLCanvasElement]")?画布:document.createElement('canvas');
		this._画布=画布;
		
		if (上下文)
			this.gl=初始化WebGL(画布, (this.上下文=上下文))
		else
			this.gl=初始化WebGL(画布, (this.上下文="webgl"))||初始化WebGL(画布, (this.上下文="experimental-webgl"))||初始化WebGL(画布, (this.上下文="webgl2"));
		
		if (!this.gl) {
			throw "初始化图像处理器失败，可能是因为您的浏览器不支持WebGL。";
			return;
		}
		
		this.名称 = 名称 || "";
		
		const gl = this.gl;
		
		类型化数组对应GL类型["[object Float32Array]"] = gl.FLOAT;
		类型化数组对应GL类型["[object Uint16Array]"] = gl.UNSIGNED_SHORT;
		类型化数组对应GL类型["[object Int16Array]"] = gl.SHORT;
		类型化数组对应GL类型["[object Uint32Array]"] = gl.UNSIGNED_INT;
		类型化数组对应GL类型["[object Int32Array]"] = gl.INT;
		类型化数组对应GL类型["[object Int8Array]"] = gl.BYTE;
		类型化数组对应GL类型["[object Uint8Array]"] = gl.UNSIGNED_BYTE;
		
		this._最大纹理数 = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
		this._纹理数 = 0;
		
		this._图像集 = {序号集: { 'uToBeProcessedImage': 0 }, 纹理集: Array(this._最大纹理数)};
		this._图像集.纹理集[ 0 ] = { 标识: 'uToBeProcessedImage' };
		
		this._序号池 = [];
		for (let i = this._最大纹理数 - 1; i>=1; i--)
			this._序号池.push( i );
		
		this._WEBGL_draw_buffers = gl.getExtension('WEBGL_draw_buffers');
		this._绘图区集 = {};
		this._当前绘图区 = null;
		
		this._未就绪资源 = 0;
		this._已启动 = false;
		this._完成回调 = null;
		
		this._默认处理器 = ()=>{};
		this._默认处理器参数 = [];
		
		this._当前处理器 = this._默认处理器;
		this._当前处理器参数 = [];
		
		this._面数 = 2;
		
		this._待处理图像 = [];
		
	}
	
	处理器类.prototype = {
		
		执行程序: function(){
			
			let 待处理 = this._待处理图像;
			let 未处理 = [];
			for ( let i = 0; i < 待处理.length; i++ ){ 
			
				let 参数 = 待处理.pop();
				if ( 参数.就绪 )
					this.载入图像( 参数.图像, 参数.标识, 参数.选项 )
				else
					未处理.push( 参数 );
				
			}
			this._待处理图像 = 未处理;
			
			if ( this._未就绪资源 === 0 && this._已启动 ){
		let start = window.performance.now();		
				this._已启动 = false;
				
				this._当前处理器.apply( this, this._当前处理器参数 );
				
				this._当前处理器 = this._默认处理器;
				this._当前处理器参数 = [];
				
				let 本 = this;
				Object.prototype.toString.apply(this._完成回调)=="[object Function]" && this._完成回调((浮点数颜色, 转换为图像)=>{return 本.获取已处理图像(浮点数颜色, 转换为图像)});
				this._完成回调 = null;
		console.log(window.performance.now()-start,'执行程序: function(){');		
			}
			
		},
		
		启动: function(完成回调){
			
			this._已启动 = true;
			this._完成回调 = 完成回调;
				
			this.执行程序();
			
		},
		
		绘制元素: function( vertexCount ){
			
				const gl = this.gl;
				gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0);
					
				//const offset = 0;
				//const vertexCount = 4;
				//gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
			
		},
		
		get 面数(){
			
			return this._面数;
			
		},
		
		set 面数(值){
			
			if ( 值 > 0 )
				this._面数 = 值;
			
		},
		
		get 纹理数(){
			
			return this._纹理数;
			
		},
		
		set 纹理数(值){
			
			console.warn("此属性只读。");
			
		},
		
		get 画布宽(){
			
			return this._画布.width;
			
		},
		
		set 画布宽(值){
			
			console.warn("此属性只读。");
			
		},
		
		get 画布高(){
			
			return this._画布.height;
			
		},
		
		set 画布高(值){
			
			console.warn("此属性只读。");
			
		},
		
		get 当前绘图区(){
			
			return this._当前绘图区;
			
		},
		
		set 当前绘图区(值){
			
			console.warn("此属性只读。");
			
		},
			
		获取已处理图像: function( 浮点数颜色, 转换为图像 ){
			
			const gl = this.gl;
			const 画布 = this._画布;
			
			if ( 转换为图像 ){
				let 数据 = new Uint8Array(  画布.width * 画布.height * 4 );
				gl.readPixels(0, 0, 画布.width, 画布.height, gl.RGBA, gl.UNSIGNED_BYTE, 数据); 
				return new ImageData( new Uint8ClampedArray(数据), 画布.width, 画布.height );
			}
			else{
				
				let 数据, 类型;
				
				if ( 浮点数颜色 ){
					数据 = new Float32Array(  画布.width * 画布.height * 4 );
					类型 = gl.FLOAT;
				}
				else{
					数据 = new Uint8Array(  画布.width * 画布.height * 4 );
					类型 = gl.UNSIGNED_BYTE;
				}
				
				gl.readPixels(0, 0, 画布.width, 画布.height, gl.RGBA, 类型, 数据); 
				return 数据;
				
			}
			
		},
		
		获取纹理: function(标识){
			
			const 纹理集 = this._图像集.纹理集;
			const 序号集 = this._图像集.序号集;
			
			if (Object.prototype.toString.apply(标识)=="[object String]"){
				
				const 序号 = 序号集[标识];
				if ( Object.prototype.toString.apply(序号)=="[object Number]" &&
					 序号 < 纹理集.length && 纹理集[序号] && 
					 纹理集[序号].纹理 instanceof 纹理类 ){
						 
						 const 记录 = 纹理集[序号];
						 return { 纹理: 记录.纹理, 序号: 序号 };
						 
				}
					 
			}
			else{
				
				if ( 标识 < 纹理集.length && 纹理集[标识] && 
					 纹理集[标识].纹理 instanceof 纹理类 ){
						
						const 记录 = 纹理集[标识];
						return { 纹理: 记录.纹理, 序号: 标识 };
						
				}
				
			}
			
			console.warn("不能找到指定的纹理：" + 标识);
			return null;
			
		},
		
		添加纹理: function(纹理, 标识){
			
			if ( !( 纹理 instanceof 纹理类 ) ){
				console.warn("“纹理”参数类型不正确！");
				return;
			}
			
			this.载入图像( 纹理, 标识 );
				
		},
		
		清除纹理: function(标识){
			
			const 纹理集 = this._图像集.纹理集;
			const 序号集 = this._图像集.序号集;
			const gl = this.gl;
			
			if ( 标识 === undefined ){
				this._纹理数 = 0;
				序号集 = { 'uToBeProcessedImage': 0 };
				
				for ( let i = 0; i < 纹理集.length; i++ ){
					let 纹理 = 纹理集[i].纹理;
					纹理.设置销毁方法();
					纹理.销毁();
				}
				
				纹理集 = Array(this._最大纹理数);
				纹理集[ 0 ] = { 标识: 'uToBeProcessedImage' };
				
				this._序号池 = [];
				for (let i = this._最大纹理数 - 1; i>=1; i++)
					this._序号池.push( i );
				
			}
			else{
				
				if (Object.prototype.toString.apply(标识)=="[object String]"){
					
					if ( 标识==='uToBeProcessedImage' ){
						
						let 纹理 = 纹理集[0].纹理;
						纹理.设置销毁方法();
						纹理.销毁();
							
						return;
						
					}
					else{
						
						const 序号 = 序号集[标识];
						if ( Object.prototype.toString.apply(序号)=="[object Number]" &&
							 序号 < 纹理集.length && 纹理集[序号] && 
							 纹理集[序号].纹理 instanceof 纹理类 ){
							
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
				else{
					
					if ( 标识 < 纹理集.length && 纹理集[标识] && 
						 纹理集[标识].纹理 instanceof 纹理类 ){
							 
						if ( 标识 === 0 ){
							
							let 纹理 = 纹理集[0].纹理;
							纹理.设置销毁方法();
							纹理.销毁();
							
						}
						else{
						 
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
	
		载入图像: function(图像, 标识, 选项, 操作回调){
			const 本 = this;
			const 纹理集 = this._图像集.纹理集;
			const 序号集 = this._图像集.序号集;
			
			const gl = 本.gl;
			
			if (Object.prototype.toString.apply(选项)!="[object Object]") 选项 = {};
			选项.多级贴图 = 选项.多级贴图 === undefined ? false : 选项.多级贴图;
			选项.缩小过滤 = 选项.缩小过滤 === undefined ? gl.NEAREST : 选项.缩小过滤;
			选项.放大过滤 = 选项.放大过滤 === undefined ? gl.NEAREST : 放大过滤;
			
			if (Object.prototype.toString.apply(标识)!="[object String]" || 标识==="")
				if ( this._纹理数 ) 
					标识 = "纹理" + ( this._纹理数 )
				else
					标识 = 'uToBeProcessedImage';
			
			var 序号 = 序号集[标识];
			if ( Object.prototype.toString.apply(序号)=="[object Number]" &&
				 序号 < 纹理集.length && 纹理集[序号] && 
				 纹理集[序号].纹理 instanceof 纹理类 ){
					 
				let 纹理 = 纹理集[序号].纹理;
				纹理.设置销毁方法();
				纹理.销毁();
					
			}
			else{
				
				this._纹理数++;
				if ( this._最大纹理数 < this._纹理数 ){
					
					this._纹理数 = this._最大纹理数;
					let a = this._纹理数 - 1;
					this._序号池.push(a);
					
					let 记录 = 纹理集[a];
					记录.纹理.设置销毁方法();
					记录.纹理.销毁();
					delete 序号集[记录.标识];
					
					console.warn("纹理数已达到WebGL的最大限制，最后一个纹理已被覆盖！");
					
				}
				
				序号集[标识] = 序号 = this._序号池.pop();
				纹理集[序号] = {标识: 标识};
				
			}
			
			const 销毁方法 = function(){};
			
			if ( 图像 instanceof 纹理类 ){
				图像.设置销毁方法(销毁方法);
				纹理集[序号].纹理 = 图像;
			}
			else{
				
				//gl.activeTexture( gl[ 'TEXTURE' + 序号 ] );
				
				纹理集[序号].纹理 = new 纹理类( this, 图像, 选项, (WEBGL纹理, 宽, 高)=>{

							if ( 标识 == 'uToBeProcessedImage' ){
							
								const 画布 = 本._画布;
								画布.width = 宽;
								画布.height = 高;
								
								gl.viewport(0, 0, 宽, 高);
							
								画布.style.width = 宽 + 'px';
								画布.style.height = 高 + 'px';
								
							}
							
							Object.prototype.toString.apply(操作回调)=="[object Function]" && 操作回调(WEBGL纹理, 宽, 高);
							
						}, 销毁方法, 标识 );
				
				/*纹理集[序号].纹理 = 载入纹理(gl, 图像, 
						(纹理, 宽, 高)=>{
							
							const 记录 = 纹理集[序号];
							记录.纹理 = 纹理;
							记录.宽 = 宽;
							记录.高 = 高;
							//console.log(记录);
							if ( 标识 == 'uToBeProcessedImage' ){
							
								const 画布 = 本.画布;
								画布.width = 宽;
								画布.height = 高;
								
								gl.viewport(0, 0, 宽, 高);
							
								画布.style.width = 宽 + 'px';
								画布.style.height = 高 + 'px';
								
							}
							
							Object.prototype.toString.apply(操作回调)=="[object Function]" && 操作回调(纹理, 宽, 高);
							
						}, 
						选项
					);*/
					
			}
				
		},
		
		添加绘图区: function(标识, 画板, 选项){
		
			const 本 = this;
			const 绘图区集 = this._绘图区集;
			
			const gl = this.gl;
			
			if (Object.prototype.toString.apply(选项)!="[object Object]") 选项 = {};
			选项.多级贴图 = 选项.多级贴图 === undefined ? false : 选项.多级贴图;
			选项.缩小过滤 = 选项.缩小过滤 === undefined ? gl.NEAREST : 选项.缩小过滤;
			选项.放大过滤 = 选项.放大过滤 === undefined ? gl.NEAREST : 放大过滤;
			
			if (Object.prototype.toString.apply(标识)!="[object String]" || 标识===""){
				console.warn('“标识”参数必须是非空字符串！');
				return;
			}
			
			var 记录 = 绘图区集[标识];
			var 绘图区 = 记录 ? 记录.绘图区 : null;
			if ( 绘图区 instanceof 绘图区类 ){
				console.warn('绘图区“'+标识+'”已存在。');
				return;
			}
			else{
			
				let 画板 = new 纹理类(this, null, 选项);
				绘图区 = new 绘图区类(this, 画板, 标识); 
				绘图区集[标识] = 绘图区;	
			
			}
				
		},
		
		获取绘图区: function( 标识 ){
			
			const 绘图区集 = this._绘图区集;
			var 绘图区 = 绘图区集[标识];
			
			if ( 绘图区 instanceof 绘图区类 )
				return 绘图区
			else
				console.warn("没有找到指定的绘图区：" + 标识);
			
			return null;
			
		},
		
		更换绘图区: function( 标识 ){
			
			let 绘图区 = this.获取绘图区( 标识 );
			if ( 绘图区 ){
				
				this.gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				console.warn("指定的绘图区不存在：" + 标识 + "，已切换到默认绘图区。");
				
			}
			else{
				
				绘图区.启用();
				
			}
			
			this._当前绘图区 = 绘图区;
			
		},
			
		设置默认处理程序: function(处理程序, 参数数组){
			this._默认处理器 = Object.prototype.toString.apply(处理程序)=="[object Function]" ? 处理程序 : this._默认处理器;
			this._默认处理器参数 = Object.prototype.toString.apply(参数数组)=="[object Array]" ? 参数数组 : [参数数组];
		},
	
		设置处理程序: function(处理程序, 参数数组){
			this._当前处理器 = Object.prototype.toString.apply(处理程序)=="[object Function]" ? 处理程序 : this._默认处理器;
			this._当前处理器参数 = Object.prototype.toString.apply(参数数组)=="[object Array]" ? 参数数组 : [参数数组];
		},
		  
		准备图像: function(图像, 标识, 选项){
			
			const 本 = this;
			
			this._未就绪资源++;
			
			if (Object.prototype.toString.apply(图像)=="[object String]"){
				
				let img = new Image();
				let 待处理 = { 图像: img, 标识: 标识, 选项: 选项, 就绪: false };
				this._待处理图像.push( 待处理 );
				img.addEventListener( 'load',function(event) {
					
						待处理.就绪 = true;
						本._未就绪资源--;
						本.执行程序();
						
					}, false );
					
				img.src = 图像;
					
			}
			else{
				
				this._待处理图像.push( { 图像: 图像, 标识: 标识, 选项: 选项, 就绪: true } );
				
				本._未就绪资源--;
				本.执行程序();
				
			}
			
			
		},
	
		销毁: function(){
			
		},
	
	}
	
	var 纹理类 = function( 处理器, 图像, 选项, 就绪回调, 销毁方法, 名称 ){
		
		if ( !( 处理器 instanceof 处理器类 ) ){
			throw "“处理器”参数无效！";
			return;
		}
		
		this._处理器 = 处理器;
		const gl = this._处理器.gl;
	
		if ( Object.prototype.toString.apply(选项)!="[object Object]") 选项={};

		选项.级别 = 选项.级别 || 0;
		选项.宽 = 选项.宽 || 1;
		选项.高 = 选项.高 || 1;
		选项.边框 = 选项.边框 || 0;
		选项.源类型 = 选项.源类型 || gl.UNSIGNED_BYTE;
		选项.多级贴图 = 选项.多级贴图 || true;
		选项.横向折回 = 选项.横向折回 || gl.REPEAT;
		选项.纵向折回 = 选项.纵向折回 || gl.REPEAT;
		选项.缩小过滤 = 选项.缩小过滤 || gl.LINEAR;
		选项.放大过滤 = 选项.放大过滤 || gl.LINEAR;
		
		this.名称 = 名称 || "";
		
		if (gl instanceof WebGLRenderingContext) {
			var internalFormat = 选项.源格式 || 选项.内部格式 || gl.RGBA;
			var srcFormat = internalFormat;
			选项.源格式 = 选项.内部格式 = srcFormat;
		}
		else{
			选项.内部格式 = 选项.内部格式 || gl.RGBA;
			选项.源格式 = 选项.源格式 || gl.RGBA;;
		}
		
		this._选项 = 选项;
		
		this._就绪回调 = ( 纹理, 宽, 高 )=>{
						
			选项.宽 = 宽;
			选项.高 = 高;
			
			Object.prototype.toString.apply( 就绪回调 )=="[object Function]" && 就绪回调( 纹理, 宽, 高 );
			
		}
		
		this._WEBGL纹理 = 载入WEBGL纹理( gl, 图像, this._就绪回调, 选项 );
		
		this._销毁方法 = 销毁方法;
		
		this._默认销毁方法 = function(){
			
			gl.deleteTexture( this._WEBGL纹理 );
			this._WEBGL纹理 = null;
			
			this._就绪回调 = null;
			this._处理器 = null;
			this._销毁方法 = null;
			
		}
		
	}
	
	纹理类.prototype = {
		
		get WEBGL纹理(){
			return this._WEBGL纹理;
		},
		
		set WEBGL纹理(值){
			console.warn("此属性只读。");
		},
		
		get 源格式(){
			return this._选项.源格式;
		},
		
		set 源格式(值){
			console.warn("此属性只读。");
		},
		
		get 内部格式(){
			return this._选项.内部格式;
		},
		
		set 内部格式(值){
			console.warn("此属性只读。");
		},
		
		get 宽(){
			return this._选项.宽;
		},
		
		set 宽(值){
			console.warn("此属性只读。");
		},
		
		get 高(){
			return this._选项.高;
		},
		
		set 高(值){
			console.warn("此属性只读。");
		},
		
		get 横向折回(){
			return this._选项.横向折回;
		},
		
		set 横向折回(值){
			if (isPowerOf2(image.width) && isPowerOf2(image.height)){
				this._选项.横向折回 = 值;
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, 值);
			}
		},
		
		get 纵向折回(){
			return this._选项.纵向折回;
		},
		
		set 纵向折回(值){
			if (isPowerOf2(this._选项.宽) && isPowerOf2(this._选项.高)){
				this._选项.纵向折回 = 值;
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, 值);
			}
		},
		
		get 缩小过滤(){
			return this._选项.缩小过滤;
		},
		
		set 缩小过滤(值){
			if (isPowerOf2(this._选项.宽) && isPowerOf2(this._选项.高)){
				this._选项.缩小过滤 = 值;
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 值);
			}	
			else
				if (值===gl.LINEAR || 值===gl.NEAREST){
					this._选项.缩小过滤 = 值;
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 值);
				};
		},
		
		get 放大过滤(){
			return this._选项.放大过滤;
		},
		
		set 放大过滤(值){
			this._选项.放大过滤 = 值;
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 值);
		},
		
		替换图像: function( 图像, 选项, 就绪回调 ){
			
			const 本 = this;
			
			var _就绪回调 = ( 纹理, 宽, 高 )=>{
							
				本._选项.宽 = 宽;
				本._选项.高 = 高;
				
				Object.prototype.toString.apply( 就绪回调 )=="[object Function]" && 就绪回调( 纹理, 宽, 高 );
				
			}
			
			this._WEBGL纹理 = 载入纹理( this._处理器.gl, 图像, _就绪回调, 本._选项 );
			
		},
		
		销毁: function(){
			if (Object.prototype.toString.apply( 就绪回调 )=="[object Function]")
				this._销毁方法()
			else
				this._默认销毁方法();
		},
		
		默认销毁方式: function(){
			this._默认销毁方法();
		},
		
		设置销毁方法: function(销毁方法){
				this._销毁方法 = 销毁方法;
		},
		
	}
	
	var 绘图区类 = function( 处理器, 画板, 名称 ){
		
		if ( !( 处理器 instanceof 处理器类 ) ){
			throw "“处理器”参数无效！";
			return;
		}
		
		this._处理器 = 处理器;
		const gl = this._处理器.gl;
	
		this._绘图区 = gl.createFramebuffer();
		if ( !this._绘图区 ){
			throw "“绘图区”创建失败！";
			return;
		}
		
		this.名称 = 名称 || "";
		
		this._WEBGL_draw_buffers = gl.getExtension('WEBGL_draw_buffers');
		if ( !this._WEBGL_draw_buffers ){
			throw "您的浏览器可能不支持多目标渲染！";
			return;
		}
		
		this._绘图区宽 = 0;
		this._绘图区高 = 0;
		
		this._最大画板数 = gl.getParameter( this._WEBGL_draw_buffers.MAX_COLOR_ATTACHMENTS_WEBGL );
		
		this._画板数 = 0;
		
		this._画板集 = {序号集: { '默认画板': 0 }, 画板集: Array(this._画板数)};
		this._画板集.画板集[ 0 ] = { 标识: '默认画板' };
		
		this._序号池 = [];
		for (let i = this._最大画板数 - 1; i>=1; i--)
			this._序号池.push( i );
		
		if ( !( 画板 instanceof  纹理类 ) )
			画板 = new 纹理类(处理器, null, {宽: 处理器.画布宽, 高: 处理器.画布高, 源类型: gl.FLOAT });
		
		this.添加画板(画板, '默认画板');
		
	}
	
	绘图区类.prototype = {
		
		get 画板数(){
			return this._画板数;
		},
		
		set 画板数(值){
			console.warn("此属性只读。");
		},
		
		get 最大画板数(){
			return this._最大画板数;
		},
		
		set 最大画板数(值){
			console.warn("此属性只读。");
		},
		
		get 绘图区宽(){
			return this._绘图区宽;
		},
		
		set 绘图区宽(值){
			console.warn("此属性只读。");
		},
		
		get 绘图区高(){
			return this._绘图区高;
		},
		
		set 绘图区高(值){
			console.warn("此属性只读。");
		},
		
		启用: function(){
			const gl = this._处理器.gl;
			gl.bindFramebuffer(gl.FRAMEBUFFER, this._绘图区);
			
		},
		
		启用默认绘图区: function(){
			const gl = this._处理器.gl;
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		},
		
		添加画板: function(画板, 标识){
			
			var 记录 = 画板;
			if (Object.prototype.toString.apply(画板)!="[object Array]"){
				var 记录 = [画板];
			}
			
			const 长度 = 记录.length;
			
			var 标 = 标识;
			if (Object.prototype.toString.apply(标识)!="[object Array]"){
				标 = Array(长度);
				标[0] = 标识;
			}
			else{
				if (标.length < 长度 ){
					标.concat( Array(长度 - 标.length ) );
				}
			}
			
			const 画板集 = this._画板集.画板集;
			const 序号集 = this._画板集.序号集;
	
			const ext = this._WEBGL_draw_buffers;
			const 最大画板数 = this._最大画板数;
			const gl = this._处理器.gl;
			
			this.启用();
			
			let 添加数 = 0, 替换数 = 0, 覆盖数 = 0;
			
			
			for ( let i = 0; i < 长度; i++ ){
				
				画板 = 记录[i];
				标识 = 标[i];
				
				if (!( 画板 instanceof  纹理类 )){
					console.warn("第"+i+"个“画板”参数无效！");
					break;
				}

				if (Object.prototype.toString.apply(标识)!="[object String]" || 标识==="")
					if ( this._画板数 ) 
						标识 = "画板" + ( this._画板数 )
					else
						标识 = '默认画板';
				
				if (标识 == '默认画板')
					if (!this._绘图区宽 || !this._绘图区高){
						this._绘图区宽 = 画板.宽;
						this._绘图区高 = 画板.高;
					}

				
				var 序号 = 序号集[标识];
				if ( Object.prototype.toString.apply(序号)=="[object Number]" &&
					 序号 < 画板集.length && 画板集[序号] && 
					 画板集[序号].纹理 instanceof 纹理类  ){
						 
					画板集[序号].纹理.销毁();
					替换数++;
					
				}
				else{
					
					添加数++;
					
					this._画板数++;
					if ( 最大画板数 < this._画板数 ){
						
						添加数--;
						覆盖数++;
						
						this._画板数 = 最大画板数;
						
						let a = 最大画板数 - 1;
						this._序号池.push(a);
						
						const 记录 = 画板集[a];
						
						delete 序号集[记录.标识];
						
						console.warn("画板数已达到WebGL的最大限制，最后一个画板已被替换！");
						
						let 余下 = 长度 - 1 - i;
						
						if ( 余下 ){
							console.warn("余下的"+余下+"个画板将不再添加。");
							break;
						}
						
					}
					
					序号集[标识] = 序号 = this._序号池.pop();
					画板集[序号] = {标识: 标识};
					
				}
				
				画板集[序号].纹理 = 画板;			
				
				let ca = ext['COLOR_ATTACHMENT'+序号+'_WEBGL'];
				gl.framebufferTexture2D(gl.FRAMEBUFFER, ca, gl.TEXTURE_2D, 画板.纹理.WEBGL纹理, 0);
				
				画板集[序号].画板编号 = ca;
				
			}
			
			if ( 添加数 || 替换数 || 覆盖数 ){
				
				let ca = [];
				for ( let i = 0; i < 画板集.length; i++ ){
					let a = 画板集[i];
					if (a && a.画板编号) ca.push(a.画板编号);
				}
				if ( ca.length ) ext.drawBuffersWEBGL(ca);
				
			}
			
		},
		
		清除画板: function(标识){
			
			const 画板集 = this._画板集.画板集;
			const 序号集 = this._画板集.序号集;
	
			const ext = this._WEBGL_draw_buffers;
			const gl = this._处理器.gl;
			
			this.启用();
			
			var 已找到 = false;
			
			if ( 标识 === undefined ){
				
				this._画板数 = 0;
				
				for ( let i = 0; i < 画板集.length; i++ ){
					画板集[i].纹理.销毁();
				}
				
				this._画板集 = {序号集: { '默认画板': 0 }, 画板集: Array(this._画板数)};
				this._画板集.画板集[ 0 ] = { 标识: '默认画板' };
				
				this._序号池 = [];
				for (let i = this._最大画板数 - 1; i>=1; i--)
					this._序号池.push( i );
				
				ext.drawBuffersWEBGL([]);
				this.启用默认绘图区();
				
			}
			else{
				
				if (Object.prototype.toString.apply(标识)=="[object String]"){
					
					if ( 标识==='默认画板' ){
						
						let 画板 = 画板集[0];
						画板.纹理.销毁();
						画板.纹理 = null;
						画板.画板编号 = 0;
						
						已找到 = true;
						
					}
					else{
						
						const 序号 = 序号集[标识];
						if ( Object.prototype.toString.apply(序号)=="[object Number]" &&
							 序号 < 画板集.length && 画板集[序号] && 
							 画板集[序号].纹理 instanceof 纹理类 ){
							
							delete 序号集[标识];
							画板集[序号].纹理.销毁();
							画板集[序号] = undefined;
							this._序号池.push(序号);
							
							已找到 = true;
							
						}
						
					}
							 		 
				}
				else{
					
					if ( 标识 < 画板集.length && 画板集[标识] && 
						 画板集[序号].纹理 instanceof 纹理类 ){
							 
						if ( 标识 === 0 ){
							
							画板集[0].纹理.销毁();
							画板集[0].纹理 = null;
							画板集[0].画板编号 = 0;
							
						}
						else{
						 
							const 记录 = 画板集[标识];
							
							画板集[标识].纹理.销毁();
							画板集[标识] = undefined;
							delete 序号集[记录.标识];
							
							this._序号池.push(标识);
							
						}
						
						已找到 = true;
					}
						
				}
				
				if ( 已找到 ){
					let ca = [];
					for ( let i = 0; i < 画板集.length; i++ ){
						let a = 画板集[i];
						if (a && a.画板编号) ca.push(a.画板编号);
					}
					if ( ca.length ) ext.drawBuffersWEBGL(ca);
				}
				else
					console.warn("没有找到要删除的指定纹理：" + 标识);
				
			}
				
		},
	
		获取画板: function(标识){
			
			const 画板集 = this._画板集.画板集;
			const 序号集 = this._画板集.序号集;
	
			const ext = this._WEBGL_draw_buffers;
			const gl = this._处理器.gl;
			
			if (Object.prototype.toString.apply(标识)=="[object String]"){
				
				const 序号 = 序号集[标识];
				if ( Object.prototype.toString.apply(序号)=="[object Number]" &&
					 序号 < 画板集.length && 画板集[序号] && 
					 画板集[序号].纹理 instanceof 纹理类 ){
						 
						 const 记录 = 画板集[序号];
						 return { 纹理: 记录.纹理, 序号: 序号 };
						 
				}
					 
			}
			else{
				
				if ( 标识 < 画板集.length && 画板集[标识] && 
					 画板集[标识].纹理 instanceof 纹理类 ){
						
						const 记录 = 画板集[标识];
						return { 纹理: 记录.纹理, 序号: 标识 };
						
				}
				
			}
			
			console.warn("不能找到指定的画板：" + 标识);
			return null;
			
		},
		
		获取画板图像: function( 浮点数颜色, 转换为图像 ){
			
			const 处理器 = this._处理器;
			let 当前画板 = 处理器.当前绘图区;
			
			this.启用();
			let 图像 = 处理器.获取已处理图像( 浮点数颜色, 转换为图像 );
			
			if (当前画板)
				处理器.更换绘图区(当前画板.名称)
			else
				处理器.更换绘图区();
			
			return 图像;
			
		},
	
		销毁: function(){
			
			this.清除画板();
			this._处理器.gl.deleteFramebuffer(this._绘图区);
			this._处理器 = null;
			this._绘图区 = null;
			this._WEBGL_draw_buffers = null;	
			this._画板集 = null;
			this._序号池 = null;

		},
		
	}

	var 着色程序信息类 = function(处理器, 顶点着色程序源, 片元着色程序源, 名称){
		if ( !( 处理器 instanceof 处理器类 ) ){
			throw "“处理器”参数无效！";
			return;
		}
		
		this._处理器 = 处理器;
		
		this._顶点着色器 = null;
		this._片元着色器 = null;
		this._程序 = null;
		
		this.名称 = 名称 || "";
		
		if ( 顶点着色程序源 && 片元着色程序源 )
			this.设置程序( 顶点着色程序源, 片元着色程序源 );
	
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
		
		get 程序(){
			return this._程序;
		},
		
		set 程序(程序){
			console.warn("此属性只读，请使用“设置程序”方法，设置程序。");
		},
		
		设置程序: function(顶点着色程序源, 片元着色程序源){
			
			const gl = this._处理器.gl;
			
			this._顶点着色器 = 创建着色器(gl, gl.VERTEX_SHADER, 顶点着色程序源);
			this._片元着色器 = 创建着色器(gl, gl.FRAGMENT_SHADER, 片元着色程序源);
			
			this._程序 = 初始化着色程序(this._处理器.gl, this._顶点着色器, this._片元着色器);
			
		},
		
		使用程序: function(){
			this._处理器.gl.useProgram( this._程序 );
		},
		
		销毁: function(){
			
			const gl = this._处理器.gl;
			
			gl.deleteProgram( this._程序 );
			gl.deleteShader( this._顶点着色器 );
			gl.deleteShader( this._片元着色器 );
			
			this._顶点着色器 = null;
			this._片元着色器 = null;
			this._程序 = null;
			this._处理器 = null;		

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
		
		设置本地特性:  function(特性名, 缓冲区数据, 选项){
			
			if (!this._程序 ){ 
				console.warn("请先使用“设置程序”方法，设置程序。");
				return;
			}
			
			const gl = this._处理器.gl;
			
			var 接收 = {};
			
			选项 = 选项 || {};
			
			const 缓冲区 = 获取缓冲区(gl, 缓冲区数据, 选项.缓冲区类型, 选项.应用类型, 接收);
			
			if (!缓冲区){
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
			
			switch (选项.缓冲区类型){
				
				case gl.ARRAY_BUFFER:
					const 特性 = 获取本地特性(gl, this._程序, 特性名);
					if (特性!=null){
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

		设置本地一致变量:  function(变量名, 数据, 类型){
			
			if (!this._程序 ){ 
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
			
			if (变量名==null){
				console.warn("“变量名”参数错误或无效。");
				return;
			}
			
			类型 = 类型 || "   ";
			
			if (Object.prototype.toString.apply(数据) == "[object Number]"){
				类型 = 类型.substr(0, 2);
				if ( 类型 != "1f" && 类型 != "1i" ) 类型 = "1f";
				gl['uniform'+类型]( 变量, 数据);
				return;
			}
			
				
			if (数据[0] == undefined) {
				console.warn("“数据”参数错误或无效。");
				//this._本地一致变量[变量名] = null;
				//this._本地一致变量值[变量名] = null;
				return;
			}
				
			if( 数据 instanceof Float32Array || 数据 instanceof Float64Array ){
				类型 = 类型.substr(0, 1) + "f" + 类型.substr(2, 1);
			}
			else if( !(数据 instanceof Array ) ){
				
				类型 = 类型.substr(0, 1) + "i" + 类型.substr(2, 1);
				
			}
				
			let l=Math.floor(Math.sqrt(数据.length));
			( l>4 ) || ( l=4 );	
			
			if ( 类型.substr(2, 1) == 'v' ){
				if ( gl['uniformMatrix'+类型] )
					gl['uniformMatrix'+类型]( 变量, false, 数据)
				else
					gl['uniformMatrix'+l+'fv']( 变量, false, 数据);
			}
			else{
				if (gl['uniform'+类型])
					gl['uniform'+类型+'v']( 变量, 数据)
				else
					gl['uniform'+l+'fv']( 变量, 数据);
				
			}

		},
		
		绑定纹理:  function( 纹理变量名 ){
			
			if (!this._程序 ){ 
				console.warn("请先使用“设置程序”方法，设置程序。");
				return;
			}
			
			const 处理器 = this._处理器;
			const gl = 处理器.gl;
			
			const 变量 = 获取本地一致变量(gl, this._程序, 纹理变量名);
			
			if ( !变量 ) {
				console.warn("指定“纹理变量名”不存在：", 纹理变量名);
				return;
			}
			
			const 记录 = 处理器.获取纹理( 纹理变量名 );
			if ( !记录 ) {
				return;
			}
			
			const 纹理 = 记录.纹理;
			
			this.设置本地一致变量( 纹理变量名 + 'Size', [纹理.宽, 纹理.高], '2f' );

			gl.activeTexture( gl['TEXTURE' + 记录.序号] );
			gl.bindTexture(gl.TEXTURE_2D, 纹理.WEBGL纹理);
			gl.uniform1i(变量, 记录.序号);
			
		},
		
	}
	
	
	var 图像处理着色程序信息类 = function(处理器, 片元着色程序源, 名称){
	
		if ( !( 处理器 instanceof 处理器类 ) ){
			throw "“处理器”参数无效！";
			return;
		}
		
		this.名称 = 名称 || "";
		
		this._父类 = 着色程序信息类;
		
		this._顶点着色程序源 = `
				attribute vec4 aVertexPosition;
				attribute vec2 aTextureCoord;

				varying highp vec2 vTextureCoord;

				void main(void) {
				  gl_Position = aVertexPosition;
				  vTextureCoord = aTextureCoord;
				}
			`;
		
		this._父类.call( this, 处理器 );
		
		this.设置程序( 片元着色程序源 );
		
	}
	
	图像处理着色程序信息类.prototype = Object.assign( Object.create( 着色程序信息类.prototype ), 
		{

			设置程序: function( 片元着色程序源 ){
				
				this._父类.prototype.设置程序.call( this, this._顶点着色程序源, 片元着色程序源 );
				
				const gl = this._处理器.gl;
				
				this.设置本地特性( 'aVertexPosition', 
									[
										-1.0,  1.0,
										 1.0,  1.0,
										-1.0, -1.0,
										 1.0, -1.0,
									],
									{
										缓冲区类型: gl.ARRAY_BUFFER,
										应用类型: gl.STATIC_DRAW,
										维数: 2,	
									});
									
				this.设置本地特性( 'aTextureCoord', 
									[
										0.0,  1.0,
										1.0,  1.0,
										0.0,  0.0,
										1.0,  0.0,
									],
									{
										缓冲区类型: gl.ARRAY_BUFFER,
										应用类型: gl.STATIC_DRAW,
										维数: 2,	
									});
														
				this.设置本地特性( 'indices', 
									[
										0,  1,  2,      
										3,  1,  2
									],
									{
										缓冲区类型: gl.ELEMENT_ARRAY_BUFFER,
										应用类型: gl.STATIC_DRAW,
									});		  

			},
			
			销毁: function(){
				
				this._顶点着色程序源 = null;
				this._父类.prototype.销毁.call( this );
				
			},
			
		});
	
	处理程序集.高斯模糊 = function ( 模糊半径, 内部调用 ){
		
		var 上次参数 = 0;
		
		const 片元着色程序源 = `
			#extension GL_EXT_draw_buffers : require
			
			varying highp vec2 vTextureCoord;

			uniform sampler2D uToBeProcessedImage;
			uniform highp vec2 uToBeProcessedImageSize;
			
			uniform sampler2D uGaosiMatrix;
			uniform highp vec2 uGaosiMatrixSize;

			void main(void) {
				
				highp vec2 uToBeProcessedImageInterval = 1.0 / uToBeProcessedImageSize;
				
				highp vec2 uGaosiInterval = 1.0 / uGaosiMatrixSize;
				
				gl_FragData[0] = vec4( 0.0 );
				
				highp float uGaosiRadius = ( uGaosiMatrixSize.x - 1.0 ) / 2.0;
				
				for ( int i = 0; i < 16384; i++ ){
					
					if ( i >= int( uGaosiMatrixSize.x ) ) break;
					
					for ( int j = 0; j < 16384; j++ ){
						
						if ( j >= int( uGaosiMatrixSize.y ) ) break;
						
						highp vec2 gaosiCoord = vec2( i , j );
						
						highp vec4 a = texture2D( uGaosiMatrix, (gaosiCoord ) * uGaosiInterval );
						gl_FragData[0] += texture2D( uToBeProcessedImage, ( vTextureCoord - uGaosiRadius * uToBeProcessedImageInterval ) + ( gaosiCoord * uToBeProcessedImageInterval ) ) * a.a;
						
					}
				}
				
				//gl_FragColor = texture2D(uToBeProcessedImage, vTextureCoord);
			}
		`;
			
		var 程序信息 = new 图像处理着色程序信息类(this, 片元着色程序源);
		程序信息.使用程序();
		
		this.高斯模糊 = function( 模糊半径, 内部调用 ){
			
			if ( !( this instanceof 处理器类 ) ){
				throw "该函数只能作为“处理器类”的方法使用！";
				return;
			}
			
	let start = window.performance.now();
					
			const gl = this.gl;

			//this.添加绘图区(标识, 画板, 选项);
			
		console.log(window.performance.now()-start,'const gl = this.gl;');	
		start = window.performance.now();
			const 本 = this;
			
			if ( 上次参数 !== 模糊半径 ){
				
				上次参数 = 模糊半径;
		模糊半径=10;
				const 高斯矩阵 = 生成高斯卷积矩阵( 模糊半径 );
				
			console.log(window.performance.now()-start,'const 高斯矩阵 = 生成高斯卷积矩阵( '+模糊半径+' );');	
			start = window.performance.now();
			
				this.准备图像( 高斯矩阵.矩阵, 'uGaosiMatrix', {宽: 高斯矩阵.边长, 高: 高斯矩阵.边长, 源格式: gl.ALPHA, 源类型: gl.FLOAT } );
				程序信息.绑定纹理( 'uGaosiMatrix' );
				
			console.log(window.performance.now()-start,'this.载入图像( 高斯矩阵.矩阵,');	
			start = window.performance.now();
			
				//程序信息.设置本地一致变量( 'uGaosiMatrixSize', 高斯矩阵.边长, '1f' );
			
			}
			
			
				//程序信息.设置本地一致变量( 'uToBeProcessedImageSize', [宽, 高], '2f' );
				 
									
			程序信息.绑定纹理( 'uToBeProcessedImage' );
			
			//start = window.performance.now();
			本.绘制元素( 本._面数 * 3 );
			console.log(window.performance.now()-start);
			
			//this.载入图像( this.画布, 'uToBeProcessedImage');
			
			//本.绘制元素( 本._面数 * 3 ); 
			
			//this.载入图像( this.画布, 'uToBeProcessedImage');
			
			//本.绘制元素( 本._面数 * 3 );
			
			//this.载入图像( this.画布, 'uToBeProcessedImage');
			
			//本.绘制元素( 本._面数 * 3 );
			
			//console.log(window.performance.now()-start, '本.绘制元素( 本._面数 * 3 );');
			
		} 
		
		this.高斯模糊( 模糊半径, 内部调用 );
	
	}

	function 初始化WebGL(canvas, Context) {
		
		canvas=(Object.prototype.toString.apply(canvas)=="[object HTMLCanvasElement]")?canvas:document.createElement('canvas');
		Context=Context?Context:"webgl2";
		
		// 创建全局变量
		var gl = null;
	  
		try {
		// 尝试获取标准上下文，如果失败，回退到试验性上下文
			gl = canvas.getContext(Context);
		}
		catch(e) {
			console.error("WebGL初始化失败，"+e+"。");
		}
		
		return gl;
	}
	
	

	//
	// creates a shader of the given type, uploads the source and compiles it.
	//创建指定类型的着色器，并编译提供的源程序。
	//

	function 创建着色器(gl, 类型, 源){


		const 着色器 = gl.createShader(类型);

		// 提供源程序给着色器对象

		gl.shaderSource(着色器, 源);

		// 编译着色器程序

		gl.compileShader(着色器);

		// 查看着色器是否编译成功
				
		if (!gl.getShaderParameter(着色器, gl.COMPILE_STATUS)) {
			console.error('编译着色器程序时发生一个错误: ', gl.getShaderInfoLog(着色器));
			gl.deleteShader(着色器);
			
			if ( Object.prototype.toString.apply( 源 ) === "[object String]" ){
				
				var 数组 = 源.split( '\n' );
				var 串 = '';
				for ( let i=0; i<数组.length; i++){
					let 行 = 数组[i];
					串 += ( ( i + 1 ) + '、' + 行 + '\n' );
				}
				
				console.error( 串 );
					
			}
			
			return null;
		}

		return 着色器;
	}
	
	function 获取本地特性(gl, 着色器程序, 特性名){

		const 特性 = gl.getAttribLocation(着色器程序, 特性名);

		if (特性===-1) {
			console.warn('不能获取本地特性: ' + 特性名);
			return null;
		}

		return 特性;
	}
	
	function 获取本地一致变量(gl, 着色器程序, 变量名){

		const 变量 = gl.getUniformLocation(着色器程序, 变量名);

		if (变量===-1) {
			console.warn('不能获取本地特性: ' + 变量名);
			return null;
		}

		return 变量;
	}
	
	
	//	
	// Initialize a shader program, so WebGL knows how to draw our data
	// 初始化着色程序，以便 WebGL 知道如何绘制数据。
	//

	function 初始化着色程序(gl, 顶点着色源程序, 片元着色源程序){
		
		var 顶点着色器, 片元着色器;
		if ( 顶点着色源程序 instanceof WebGLShader ){
			顶点着色器 = 顶点着色源程序;
		}
		else{
			顶点着色器 = 创建着色器(gl, gl.VERTEX_SHADER, 顶点着色源程序);
			if ( !(顶点着色器 instanceof WebGLShader ) ){
				console.error('未能初始化着色程序，“顶点着色源程序”参数错误或无效！');
				return null;
			}
		}
		
		if ( 片元着色源程序 instanceof WebGLShader ){
			片元着色器 = 片元着色源程序;
		}
		else{
			片元着色器 = 创建着色器(gl, gl.FRAGMENT_SHADER, 片元着色源程序);
			if ( !(片元着色器 instanceof WebGLShader ) ){
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
	
	
	//
	// Initialize a texture and load an image.
	// When the image finished loading copy it into the texture.
	//
	function 载入WEBGL纹理 (gl, 数据, 完成回调, 选项) {
		
		if ( Object.prototype.toString.apply(选项)!="[object Object]") 选项={};
	
		// Because images have to be download over the internet
		// they might take a moment until they are ready.
		// Until then put a single pixel in the texture so we can
		// use it immediately. When the image has finished downloading
		// we'll update the texture with the contents of the image.
		const level = 选项.级别 || 0;
		var width = 选项.宽 || 1;
		var height = 选项.高 || 1;
		const border = 选项.边框 || 0;
		const srcType = 选项.源类型 || gl.UNSIGNED_BYTE;
		const mipmap = 选项.多级贴图 || true;
		const warpS = 选项.横向折回 || gl.REPEAT;
		const warpT = 选项.纵向折回 || gl.REPEAT;
		const minFilter = 选项.缩小过滤 || gl.LINEAR;
		const magFilter = 选项.放大过滤 || gl.LINEAR;
		
		if (gl instanceof WebGLRenderingContext) {
			var internalFormat = 选项.源格式 || 选项.内部格式 || gl.RGBA;
			var srcFormat = internalFormat;
		}
		else{
			var internalFormat = 选项.内部格式 || gl.RGBA;
			var srcFormat = 选项.源格式 || gl.RGBA;;
		}
		
		var Ext;
		switch (srcType){
			
			case gl.FLOAT:	Ext=gl.getExtension('OES_texture_float');
							break;
							
			case gl.UNSIGNED_SHORT:	Ext=gl.getExtension('WEBGL_depth_texture');
							break;
							
			case gl.UNSIGNED_INT:	Ext=gl.getExtension('WEBGL_depth_texture');
							break;	
							
		}
		
		
		const 纹理 = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, 纹理);
		
		if (Object.prototype.toString.apply(数据)=="[object String]"){
			
			const pixel = null;//new Uint8Array([0, 0, 255, 255]);  // 图片没加载前，使用蓝色背景。
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
						width, height, border, srcFormat, srcType,
						pixel);

			const image = new Image();
			image.addEventListener( 'load',function(event) {
				
				gl.bindTexture(gl.TEXTURE_2D, 纹理);
				gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
							  srcFormat, srcType, image);

				// WebGL1 has different requirements for power of 2 images
				// vs non power of 2 images so check if the image is a
				// power of 2 in both dimensions.
				if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
				   // Yes, it's a power of 2. Generate mips.
				   选项.多级贴图 && gl.generateMipmap(gl.TEXTURE_2D);
				   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, 选项.横向折回);
				   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, 选项.纵向折回);
				   
				} else {
				   // No, it's not a power of 2. Turn of mips and set
				   // wrapping to clamp to edge
				   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				   
				   if (选项.缩小过滤!==gl.LINEAR && 选项.缩小过滤!==gl.NEAREST) 选项.缩小过滤=gl.LINEAR;
				}
				
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 选项.缩小过滤);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, 选项.放大过滤);
				
				console.log("纹理载入完成。");
				Object.prototype.toString.apply(完成回调)=="[object Function]" && 完成回调(纹理, image.width, image.height);
				
			}, false);
			image.src = 数据;
		}
		else{
			
			if ( 数据 instanceof HTMLImageElement || 数据 instanceof HTMLCanvasElement || 数据 instanceof HTMLVideoElement ){
					
				gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, 数据);
				
				width = 数据.width;
				height = 数据.height;
				
			}
			else{
				
				let pixel;
				if (!数据 || (数据 && 数据[0]==undefined)) 
					pixel = null
				else{
				
					pixel = new Uint16Array(数据);
					
					switch (srcType){
					
						case gl.FLOAT:	pixel = new Float32Array(数据);
										break;
										
						case gl.UNSIGNED_INT:	pixel = new Uint32Array(数据);
										break;	
						
						case gl.UNSIGNED_BYTE:	pixel = new Uint8Array(数据);
										break;
										
						case gl.UNSIGNED_SHORT_5_6_5:	pixel = new Uint16Array(数据);
										break;

						case gl.UNSIGNED_SHORT_4_4_4_4:	pixel = new Uint16Array(数据);
										break;

						case gl.UNSIGNED_SHORT_5_5_5_1:	pixel = new Uint16Array(数据);
										break;

						case gl.UNSIGNED_SHORT:	pixel = new Uint16Array(数据);
										break;				
										
					}
				
				}
								
				gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
							width, height, border, srcFormat, srcType,
							pixel);
						
			}
			
			if (isPowerOf2(width) && isPowerOf2(height)) {
			   // Yes, it's a power of 2. Generate mips.
			   选项.多级贴图 && gl.generateMipmap(gl.TEXTURE_2D);
			   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, 选项.横向折回);
			   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, 选项.纵向折回);
			   
			} else {
			   // No, it's not a power of 2. Turn of mips and set
			   // wrapping to clamp to edge
			   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			}
			
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 选项.缩小过滤);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, 选项.放大过滤);
			
			console.log("纹理载入完成。");
				
			Object.prototype.toString.apply(完成回调)=="[object Function]" && 完成回调(纹理, width, height);
						
		}

		return 纹理;
	}
	
	
	function isPowerOf2(value) {
		return (value & (value - 1)) == 0;
	}

	function isPowerOf2(value) {
	  return (value & (value - 1)) == 0;
	}
	
	
	function 获取缓冲区(gl, 缓冲区数据, 缓冲区类型, 应用类型, 返回值) {
		if (!(gl || 缓冲区数据)) return null;
		if (Object.prototype.toString.apply(gl)!="[object WebGLRenderingContext]") throw "非“WebGLRenderingContext”对象！";
		
		缓冲区类型=缓冲区类型||gl.ARRAY_BUFFER;
		应用类型=应用类型||gl.STATIC_DRAW;

		const buffer = gl.createBuffer();
		gl.bindBuffer(缓冲区类型, buffer);
		返回值 = 返回值 || {};
		
		返回值.类型 = 类型化数组对应GL类型[Object.prototype.toString.apply(缓冲区数据)];
		
		switch (缓冲区类型){
			case gl.ARRAY_BUFFER:
				(返回值.类型===undefined) && (缓冲区数据 = new Float32Array(缓冲区数据));
				gl.bufferData(缓冲区类型, 缓冲区数据, 应用类型);
				break;
			case gl.ELEMENT_ARRAY_BUFFER:
				gl.bufferData(缓冲区类型, new Uint16Array(缓冲区数据), 应用类型);
				break;
		}
		
		return buffer;
	}
		
	
	//var 一维正态分布=1/(sigema*Math.sqrt(Math.PI*2))*Math.exp(-(x*x)/(2*sigema*sigema));
	//var 二维正态分布=1/(sigema*sigema*Math.PI*2)*Math.exp(-(x*x+y*y)/(2*sigema*sigema));
	//其中，平均值为0。
	
	//var 二维标准正态分布=1/(Math.PI*2)*Math.exp(-(x*x+y*y)/2);
  
	//var 二维带系数标准正态分布=1/(Math.PI*2)*Math.exp(-k*k*(x*x+y*y)/2);
	//当k为1时，只要其分布概率小于0.039894228，则记为0，此时对应的半径（即x为0时的y值，或y为0时的x值）约为2。
	//以此为标准，当指定半径r时，便可以求出k值：k=sqrt(4/(r*r))。
	function 生成高斯卷积矩阵(半径){
		
		半径=半径||1;
		
		const sigema=1;
		const sigemaXsigema = sigema*sigema;
		
		if (!半径>=0.2) 半径=0.2; //半径最小为0.2。
		const kxk=4.5/(半径*半径);
		半径=Math.ceil(半径);
		const 边=半径*2+1;
		
		//计算矩阵。
		const 长度=边*边;
		var 矩阵=Array(长度);
		
		var g=1/(sigemaXsigema*Math.PI*2)*Math.exp(0);
		矩阵[半径*边+半径]=g;
		
		var 和=g;
		
		for(let i=0;i<半径;i++){
			let y=半径-i;
			let yxy=y*y;
			for(let j=0;j<半径;j++){
				let x=半径-j;
				let G=1/(sigemaXsigema*Math.PI*2)*Math.exp(-kxk*(x*x+yxy)/(2*sigemaXsigema));
				矩阵[i*边+j]=G;
				矩阵[i*边+2*半径-j]=G;
				矩阵[(2*半径-i)*边+j]=G;
				矩阵[(2*半径-i)*边+2*半径-j]=G;
				和+=4*G;
			}
		}
		
		for(let i=0;i<半径;i++){
			let y=半径-i;
			let G=1/(sigemaXsigema*Math.PI*2)*Math.exp(-kxk*y*y/(2*sigemaXsigema));
			矩阵[i*边+半径]=G;
			矩阵[半径*边+2*半径-i]=G;
			矩阵[半径*边+i]=G;
			矩阵[(2*半径-i)*边+半径]=G;
			和+=4*G;
		}
		
		//归一化。
		//for(let i=0;i<长度;i++) 和+=矩阵[i];
		for(let i=0;i<长度;i++) 矩阵[i]/=和;
		
		return {矩阵:矩阵, 边长:边};
	  
	}
	
	
	function 生成高斯模糊着色源程序(高斯卷积矩阵, 宽, 高){
		
		if ( !(高斯卷积矩阵 && 宽 && 高 ) ) throw "参数不足！";
		
		if (!宽>=1) 宽=1;
		if (!高>=1) 高=1;
		
		try{
			if( 高斯卷积矩阵.矩阵.length !== 高斯卷积矩阵.边长 * 高斯卷积矩阵.边长 )
				throw "“高斯卷积矩阵”参数不正确！";
		}catch(e){
			throw "“高斯卷积矩阵”参数不正确！";
		}
		
		const 顶点着色程序源 = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;

			varying highp vec2 vTextureCoord;

			void main(void) {
			  gl_Position = aVertexPosition;
			  vTextureCoord = aTextureCoord;
			}
		 `;
  

		const 横间隔=1/宽;
		const 纵间隔=1/高;
		
		const 边=高斯卷积矩阵.边长;
		const 半径=(边-1)/2;
		
		const 矩阵=高斯卷积矩阵.矩阵;
		
		var 计算字符串="";
		for(let i=0;i<边;i++){
			let y=i-半径;
			let yxy=(y*纵间隔).toFixed(10);
			for(let j=0;j<边;j++){
				let x=j-半径;
				计算字符串+='gl_FragColor += texture2D(uSampler, vTextureCoord+vec2('+(横间隔*x).toFixed(10)+','+yxy+'))*'+矩阵[i*边+j].toFixed(10)+';';
			}
		}
		
		const 片元着色程序源 = `
			varying highp vec2 vTextureCoord;

			uniform sampler2D uSampler;

			void main(void) {
			  ${计算字符串}
			}
		`;
		
		return {顶点着色程序源: 顶点着色程序源, 片元着色程序源: 片元着色程序源};
	}
	
	function 高斯模糊( 图片, 模糊半径, 完成回调){
		
		var 处理器 = new 处理器类();
		
		处理器.设置处理程序( 处理程序集.高斯模糊, [ 模糊半径 ] );
		
		处理器.准备图像(图片, 'uToBeProcessedImage');
		
		处理器.启动(完成回调);
		
		处理.绘制 = ()=>{处理器.绘制元素( 处理器._面数 * 3 )};
		
	}
	
	处理.运行=(图像路径, 完成回调)=>{
		高斯模糊( 图像路径, 高斯半径, 完成回调 );
	};
	
	图像处理=处理;
	
})();





