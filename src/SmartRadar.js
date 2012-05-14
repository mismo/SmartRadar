/*!
 * SmartRadar chart, based on Raphael.js
 *
 * Version: @VERSION
 * Date: @DATE
 */
(function(R, UNDEF) {
	var exportName = 'smartRadar', log = function(msg) {
		if (typeof console !== 'undefined') {
			console.log(msg);
		}
	}, isUndef = function(obj, deepCheck) {
		return !!deepCheck ? obj === UNDEF : obj == UNDEF;
	};
	if (!R) {
		throw new Error('SmartRadar based on RaphaelJS, but Raphael does not exist!');
	} else if (R.fn[exportName]) {
		log('SmartRadar already exist!');
		return;
	}

	var hasOwn = Object.prototype.hasOwnProperty, isPlainObject = function(obj) {
		if (!obj || !R.is(obj, 'object') || obj.nodeType || obj == obj.window) {
			return false;
		}
		try {
			if (obj.constructor && !hasOwn.call(obj, 'constructor')) {
				if (!hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
					return false;
				}
			}
		} catch (e) {
			return false;
		}
		var key;
		for (key in obj) {
		}
		return isUndef(key, true) || hasOwn.call(obj, key);
	}, extend = /* R._extend = */function() { // jQuery.extend
		var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {};
		var i = 1, length = arguments.length, deep = false, isPlain = isPlainObject;
		if (typeof target === 'boolean') {
			deep = target;
			target = arguments[1] || {};
			i = 2;
		}
		if (typeof target !== 'object' && !R.is(target, 'function')) {
			target = {};
		}
		if (length === i) {
			target = this;
			--i;
		}
		for (; i < length; i++) {
			if ((options = arguments[i]) != null) {
				for (name in options) {
					src = target[name];
					copy = options[name];
					if (target === copy) {
						continue;
					}
					if (deep && copy && (isPlain(copy) || (copyIsArray = R.is(copy, 'array')))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && R.is(src, 'array') ? src : [];
						} else {
							clone = src && isPlain(src) ? src : {};
						}
						target[name] = extend(deep, clone, copy);
					} else if (!isUndef(copy, true)) {
						target[name] = copy;
					}
				}
			}
		}
		return target;
	}, isBBoxIntersect = R.isBBoxIntersect;

	/**
	 * 获取默认配置
	 */
	function getDefOpts() {
		var opts = {
			// 雷达中心点(原点)的x坐标
			centerX : 300,

			// 雷达中心点(原点)的y坐标
			centerY : 300,

			// 默认字体
			font : R._availableAttrs.font,

			// 文字默认颜色
			textFill : '#000',

			// 雷达半径(线)默认长度，真实长度与雷达辐射区域meshes有关
			defaultRadius : 200,

			// “其它”类别所占区域填充颜色
			otherCategoryFill : 'none',

			// 辐射区域边界线的默认填充颜色
			meshDefaultFill : 'none',

			// 边界线的默认边框颜色
			meshDefaultStroke : '#5D5E3E',

			// 边界线的默认边框宽度
			meshDefaultStrokeWidth : 1,

			// 指标值圆点的默认半径
			valuePointDefaultRadius : 5,

			// 指标值圆点的默认填充颜色
			valuePointDefaultFill : '#FFF',

			// 指标值圆点的默认边框颜色
			valuePointDefaultStroke : '#0000FF',

			// 指标值圆点的默认边框宽度
			valuePointDefaultStrokeWidth : 3,

			// 指标值圆点的点击事件处理函数
			valuePointClickHandler : null,

			// 雷达半径(线)的填充颜色
			armFill : 'none',

			// 雷达半径(线)的边框颜色
			armStroke : '#5D5E3E',

			// 雷达半径(线)的边框宽度
			armStrokeWidth : 1,

			// 指标值连线的填充颜色不透明度
			pathFillOpacity : 1,

			// 指标值连线的填充颜色
			pathFill : 'none',

			// 指标值连线的边框颜色
			pathStroke : '#121D31',

			// 指标值连线的边框宽度
			pathStrokeWidth : 2,

			// 显示指标值的显示格式(例如，指标值两侧加圆括号： '(@VALUE@)' )
			valueNumberFormat : '@VALUE@',

			// 显示指标值的显示位置('default', 'under_label')
			valueNumberPostion : 'default',

			// 显示指标值的字体大小
			valueNumberFontSize : 12,

			// “类别”图例的字体大小
			categoryLegendFontSize : 12,

			// 显示指标名称的字体大小
			labelFontSize : 12,

			// “类别”显示起始角度
			startAngle : 270,

			// 是否显示指标名称
			drawLabels : true,

			// 是否显示指标值
			drawValueNumbers : true,

			// 是否显示雷达半径(线)
			drawArms : true,

			// 是否显示辐射区域边界线
			drawMeshes : true,

			// 是否显示类别图例
			drawCategoryLegends : true,

			// 是否需要“虚拟指标”以分隔不同“类别”
			virtualMember : 0,

			// 雷达辐射区域
			// [ {
			// width : 50, // 辐射区域宽度，即圆环半径
			// valuePointRadius : 5, // 辐射区域内指标值对应的圆点的半径
			// valuePointFill : '#FF0000', // 辐射区域内指标值对应的圆点的填充颜色
			// valuePointStroke : '#A9AE52', // 圆点的边框颜色
			// valuePointStrokeWidth : 1, // 圆点的边框宽度
			// meshFill : 'none', // 辐射区域边界线的填充颜色
			// meshStroke : '#FF0000', // 边界线的边框颜色
			// meshStrokeWidth : 1 // 边界线的边框宽度
			// }, ... ]
			meshes : null,

			// 类别
			// [ {
			// name : '客户服务能力', // 类别名称
			// fill : '#FBFACC', // 类别所占区域填充颜色
			// criticalValues : [ 0, 30, 60, 100 ] // 辐射区域分界值，个数为“辐射区域”个数加1
			// }, ... ]
			categories : null,

			// 指标
			// [ {
			// name : '客户服务满意度', // 指标名称
			// category : '客户服务能力', // 所属类别，不指定则属于“其它”类别
			// criticalValues : [ 0, 50, 80, 100 ] // 辐射区域分界值(假设有3个辐射区域，则除了首尾2个分界值外还有2个分界值)
			// }, ... ]
			members : []
		};
		return opts;
	}

	/**
	 * 构造函数
	 */
	function SmartRadar(paper, options, values) {
		var t = this;
		t.paper = paper;
		t.options = extend({}, getDefOpts(), options);
		t._store = {
			// 最外层的半径
			outerRadius : t.options.defaultRadius,

			// “其它”“类别”名称
			OTHER_CATEGORY_NAME : '_OTHER_',

			// 扇形(或半径)个数
			unitCount : 0,

			// 每个扇形的角度
			unitAngle : 360,

			// array to map(array方式可以保持顺序，map方式可以快速定位)
			categoriesMap : {},

			// 缓存一部分paper创建的元素
			elements : {}
		};
		//
		t.init();
		t.draw(values);
	}

	/**
	 * 析构函数
	 */
	SmartRadar.prototype.destroy = function() {
		var t = this;
		t.clear();
		//
		delete t.values;
		delete t._store;
		delete t.options;
		delete t.paper;
	};

	/**
	 * 清除所有缓存信息
	 */
	SmartRadar.prototype.clear = function() {
		var t = this, store = t._store;
		t._clearValueElements();
		t._clearLabelElements();
		delete store.categoriesMap;
		delete store.elements;
	};

	/*
	 * 清除“指标名称”相关缓存信息
	 */
	SmartRadar.prototype._clearLabelElements = function() {
		var t = this, store = t._store, elems = store.elements;
		if (elems.labelSet) {
			t._clearSet(elems.labelSet);
			delete elems.labelSet;
		}
	};

	/*
	 * 清除“指标”值相关缓存信息
	 */
	SmartRadar.prototype._clearValueElements = function() {
		var t = this, store = t._store, elems = store.elements;
		if (elems.valuePath) {
			elems.valuePath.remove();
			delete elems.valuePath;
		}
		if (elems.valueCircleSet) {
			t._clearSet(elems.valueCircleSet);
			delete elems.valueCircleSet;
		}
		if (elems.valueTextSet) {
			t._clearSet(elems.valueTextSet);
			delete elems.valueTextSet;
		}
	};

	/*
	 * 
	 */
	SmartRadar.prototype._clearSet = function(set) {
		if (set) {
			while (set.items.length) {
				var elem = set.pop();
				elem.remove();
			}
			set.clear();
		}
	};

	/**
	 * 获取相对圆心(cx, cy)为指定距离(r)和指定角度(angle)的位置
	 */
	SmartRadar.prototype.getPosition = function(r, angle, cx, cy) {
		var t = this, opts = t.options;
		var rad = R.rad(angle); // 将“角度”转为“弧度”
		cx = cx == null ? opts.centerX : cx;
		cy = cy == null ? opts.centerY : cy;
		return {
			x : cx + (r * Math.cos(rad)),
			y : cy + (r * Math.sin(rad))
		};
	};

	/**
	 * 初始化画图所需参数
	 */
	SmartRadar.prototype.init = function() {
		var t = this, opts = t.options, store = t._store;
		t._initMeshes();
		t._initCategories();
		t._initMembers();
	};

	/*
	 * 处理meshes设置： 1、正常详细设置; 2、meshes = [ {}, {}, {} ]; 3、"meshes = null" or "meshes = []".
	 */
	SmartRadar.prototype._initMeshes = function() {
		var t = this, opts = t.options, store = t._store;
		var defRadius = opts.defaultRadius = parseFloat(opts.defaultRadius);
		var meshes = opts.meshes, mesh, len;
		//
		if (meshes && (len = meshes.length) > 0) {
			var radius = 0, i, w;
			for (i = 0; i < len; i++) {
				mesh = meshes[i];
				w = parseFloat(mesh.width);
				// 处理width属性没有指定的情况，按个数平分
				radius += (mesh.width = R.is(w, 'finite') ? w : (defRadius / len));

				// 处理“meshes = [ {}, {}, {} ]”的情况，按默认属性平分长度
				if (!R.is(mesh.valuePointRadius - 0, 'finite')) {
					mesh.valuePointRadius = opts.valuePointDefaultRadius;
				}
				if (isUndef(mesh.valuePointFill)) {
					mesh.valuePointFill = opts.valuePointDefaultFill;
				}
				if (isUndef(mesh.valuePointStroke)) {
					mesh.valuePointStroke = opts.valuePointDefaultStroke;
				}
				if (!R.is(mesh.valuePointStrokeWidth - 0, 'finite')) {
					mesh.valuePointStrokeWidth = opts.valuePointDefaultStrokeWidth;
				}
				if (isUndef(mesh.meshFill)) {
					mesh.meshFill = opts.meshDefaultFill;
				}
				if (isUndef(mesh.meshStroke)) {
					mesh.meshStroke = opts.meshDefaultStroke;
				}
				if (!R.is(mesh.meshStrokeWidth - 0, 'finite')) {
					mesh.meshStrokeWidth = opts.meshDefaultStrokeWidth;
				}
			}
			store.outerRadius = radius; // 修正最外层的半径
		} else { // 没有指定“辐射区域”时，默认只有1个辐射区域
			opts.meshes = [ {
				width : defRadius,
				valuePointRadius : opts.valuePointDefaultRadius,
				valuePointFill : opts.valuePointDefaultFill,
				valuePointStroke : opts.valuePointDefaultStroke,
				valuePointStrokeWidth : opts.valuePointDefaultStrokeWidth,
				meshFill : opts.meshDefaultFill,
				meshStroke : opts.meshDefaultStroke,
				meshStrokeWidth : opts.meshDefaultStrokeWidth
			} ];
		}
	};

	/*
	 * 添加“其它”类别
	 */
	SmartRadar.prototype._addOtherCategory = function() {
		var t = this, opts = t.options, store = t._store, categories = opts.categories;
		var otherCate = {
			name : store.OTHER_CATEGORY_NAME,
			fill : opts.otherCategoryFill,
			criticalValues : [ 0 ]
		}, meshLen = opts.meshes.length;
		for (i = 1; i <= meshLen; i++) {
			otherCate.criticalValues.push(store.outerRadius / meshLen * i);
		}
		categories.push(otherCate);
		return otherCate;
	};

	/*
	 * category名称须唯一且不能为空，处理categories设置：1、正常详细设置; 2、"categories = null" or "categories = []".
	 */
	SmartRadar.prototype._initCategories = function() {
		var t = this, opts = t.options, store = t._store;
		var categories = opts.categories = opts.categories || [], category;
		var i, j, len, cname, cateMap = store.categoriesMap, meshLen = opts.meshes.length;

		// 不指定“类别”时，所有指标都归为“其它”“类别”
		if (categories.length === 0) {
			t._addOtherCategory();
		}

		// 缓存“类别”信息，以便可以按类别名称快速定位相关信息
		for (i = 0, len = categories.length; i < len; i++) {
			category = categories[i];
			cname = category.name;
			if (!cname || cname in cateMap) { // 名称须唯一且不能为空，否则忽略该配置
				categories.splice(i, 1);
				--len;
				--i;
				continue;
			}
			if (isUndef(category.fill)) {
				category.fill = opts.otherCategoryFill;
			}
			if (isUndef(category.criticalValues) || category.criticalValues.length != meshLen + 1) {
				category.criticalValues = [ 0 ];
				for (j = 1; j <= meshLen; j++) {
					category.criticalValues.push(store.outerRadius / meshLen * j);
				}
			}
			cateMap[cname] = {
				config : category,
				members : []
			};
		}
	};

	/*
	 * 处理members设置：1、正常详细设置; 2、"members=null" or "members=[]"; 3、"members=['USA','Canada','China']".
	 */
	SmartRadar.prototype._initMembers = function() {
		var t = this, opts = t.options, store = t._store, categories = opts.categories;
		var members = opts.members = opts.members || [], count = members.length;
		var i, len, member, cateMap = store.categoriesMap;
		var meshLen = opts.meshes.length;

		for (i = 0, len = members.length; i < len; i++) {
			member = members[i];
			if (!R.is(member, 'object')) { // members = ['USA','Canada','China']
				member = members[i] = {
					name : member
				};
			}

			// 修正“指标”所属“类别”，没指定或指定的不存在都归为“其它”
			if (!member.category || !cateMap[member.category]) {
				member.category = store.OTHER_CATEGORY_NAME;

				// "members = ['USA','Canada','China']" and "categories = 正常详细设置"
				if (!cateMap[member.category]) {
					var cate = t._addOtherCategory();
					cateMap[member.category] = {
						config : cate,
						members : []
					};
				}
			}

			// 若不指定辐射区域分界值或长度不正确，则修正为“类别”的辐射区域分界值设置
			if (isUndef(member.criticalValues) || member.criticalValues.length != meshLen + 1) {
				member.criticalValues = cateMap[member.category].config.criticalValues;
			}

			cateMap[member.category].members.push(member);
		}

		// 计算需要画的半径(arms)数量
		if (opts.virtualMember && (len = categories.length) > 1) {
			count += len;
		}

		//
		store.unitCount = count;
		store.unitAngle = 360 / count;
	};

	/**
	 * 画整张雷达图
	 */
	SmartRadar.prototype.draw = function(values) {
		var t = this;

		// 由底至顶一层层地画
		t._drawCategories();
		t._drawArms();
		t._drawMeshes();
		t._drawLabels();
		//
		t.drawValues(values);
	};

	/*
	 * 画“类别”信息
	 */
	SmartRadar.prototype._drawCategories = function() {
		var t = this, paper = t.paper, opts = t.options, store = t._store;
		var calcCategory = function(r, beginAngle, count) {
			var pathData = [], i = 0, currAngle = beginAngle, unitAngle = store.unitAngle, pos;
			pathData.push('M');
			pathData.push(opts.centerX);
			pathData.push(opts.centerY);
			while (i++ < count) {
				pos = t.getPosition(r, currAngle);
				pathData.push('L');
				pathData.push(pos.x);
				pathData.push(pos.y);
				currAngle += unitAngle;
			}
			pathData.push('Z');
			return pathData.join(',');
		};
		var categories = opts.categories, len = categories.length, i;
		if (len < 2) {
			return;
		}
		var hasVirMem = opts.virtualMember, r = store.outerRadius, memLen, cateName;
		var currAngle = hasVirMem ? (opts.startAngle - store.unitAngle) : opts.startAngle;
		var offset = hasVirMem ? 1 : 0, cateMap = store.categoriesMap;
		for (i = 0; i < len; i++) {
			cateName = categories[i].name;
			memLen = cateMap[cateName].members.length;
			paper.path(calcCategory(r, currAngle, memLen + offset + 1)).attr({
				fill : categories[i].fill,
				stroke : 'none'
			});
			currAngle += store.unitAngle * (memLen + offset);
		}
		t._drawCategoryLegends();
	};

	/*
	 * 画“类别”图例
	 */
	SmartRadar.prototype._drawCategoryLegends = function() {
		var t = this, paper = t.paper, opts = t.options, store = t._store;
		var categories = opts.categories, len = categories.length, i;
		var cx = opts.centerX, r = store.outerRadius, text = categories[0].name;
		var legendIconWidth = 14, x = cx, y, elem, bbox, y2;
		if (!opts.drawCategoryLegends || len < 2) {
			return;
		}
		y = t.getPosition(r, 90).y;
		elem = paper.text(cx, y, text).attr('font', opts.font).attr({
			'text-anchor' : 'middle',
			'font-size' : opts.categoryLegendFontSize,
			'fill' : opts.textFill
		});
		bbox = elem.getBBox();
		x = Math.max(x - (bbox.width + legendIconWidth / 2 * 3 + 2) * len / 2, legendIconWidth / 2);
		y += bbox.height + 2;
		elem.remove();
		//
		if (opts.drawLabels) {
			elem = paper.text(cx, y, text).attr('font', opts.font).attr({
				'font-size' : opts.labelFontSize,
				'fill' : opts.textFill
			});
			bbox = elem.getBBox();
			y += bbox.height + 2;
			elem.remove();
		}
		//
		if (opts.drawValueNumbers) {
			elem = paper.text(cx, y, text).attr('font', opts.font).attr({
				'font-size' : opts.valueNumberFontSize,
				'fill' : opts.textFill
			});
			bbox = elem.getBBox();
			y += bbox.height + 2;
			elem.remove();
		}
		//
		for (i = 0; i < len; i++) {
			elem = paper.rect(x, y, legendIconWidth, legendIconWidth);
			elem.attr({
				fill : categories[i].fill,
				stroke : 'none'
			});
			bbox = elem.getBBox();
			x = bbox.x2 + 2;
			y2 = bbox.y + bbox.height / 2;
			elem = paper.text(x, y2, categories[i].name);
			elem.attr('font', opts.font).attr({
				'text-anchor' : 'start',
				'font-size' : opts.categoryLegendFontSize,
				'fill' : opts.textFill
			});
			bbox = elem.getBBox();
			x = bbox.x2 + legendIconWidth / 2 * 3;
		}
	};

	/*
	 * 画半径线
	 */
	SmartRadar.prototype._drawArms = function() {
		var t = this, paper = t.paper, opts = t.options, store = t._store;
		if (!opts.drawArms) {
			return;
		}
		var calcArm = function(r, angle) {
			var cx = opts.centerX, cy = opts.centerY, pos = t.getPosition(r, angle, cx, cy);
			return [ 'M', cx, cy, 'L', pos.x, pos.y, 'Z' ].join(',');
		}, i = 0, count = store.unitCount, angle = store.unitAngle, r = store.outerRadius;
		while (i < count) {
			paper.path(calcArm(r, opts.startAngle + angle * i)).attr({
				fill : opts.armFill,
				stroke : opts.armStroke,
				'stroke-width' : opts.armStrokeWidth
			});
			++i;
		}
	};

	/*
	 * 画辐射区域分界线
	 */
	SmartRadar.prototype._drawMeshes = function() {
		var t = this, paper = t.paper, opts = t.options, store = t._store;
		if (!opts.drawMeshes) {
			return;
		}
		var calcMesh = function(r, unitAngle) {
			var mesh = [ 'M' ];
			var currAngle = opts.startAngle, endAngle = currAngle + 360;
			while (currAngle < endAngle) {
				var pos = t.getPosition(r, currAngle);
				mesh.push(pos.x);
				mesh.push(pos.y);
				mesh.push('L');
				currAngle += unitAngle;
			}
			mesh.push('Z');
			return mesh.join(',');
		}, meshes = opts.meshes, len, i, r = 0, unitAngle = store.unitAngle;
		for (i = 0, len = meshes.length; i < len; i++) {
			r += meshes[i].width;
			paper.path(calcMesh(r, unitAngle)).attr({
				fill : meshes[i].meshFill,
				stroke : meshes[i].meshStroke,
				'stroke-width' : meshes[i].meshStrokeWidth
			});
		}
	};

	/*
	 * 画指标名称
	 */
	SmartRadar.prototype._drawLabels = function() {
		var t = this, paper = t.paper, opts = t.options, store = t._store;
		if (!opts.drawLabels) {
			return;
		}
		var calcLabel = function(r, angle, title) {
			var cx = opts.centerX, cy = opts.centerY, round = Math.round;
			var pos = t.getPosition(r, angle, cx, cy), x = pos.x, y = pos.y;
			return {
				x : (round(x) === cx) ? x : (x < cx ? x - 10 : x + 10),
				y : (round(y) === cy) ? y : (y < cy ? y - 10 : y + 10),
				attr : {
					'text-anchor' : (round(x) === cx) ? 'middle' : (x < cx ? 'end' : 'start'),
					'font-size' : opts.labelFontSize,
					'fill' : opts.textFill,
					'title' : title
				}
			};
		};
		//
		var cateMap = store.categoriesMap, r = store.outerRadius, unitAngle = store.unitAngle;
		var hasVirMem = opts.virtualMember, offset = hasVirMem ? 1 : 0;
		var currAngle = hasVirMem ? (opts.startAngle - unitAngle) : opts.startAngle;
		var categories = opts.categories, len, i, members, memLen, j, memName, obj;
		var elems = store.elements, labelSet = elems.labelSet = paper.set(), elem;
		for (i = 0, len = categories.length; i < len; i++) {
			members = cateMap[categories[i].name].members;
			currAngle += unitAngle * offset;
			for (j = 0, memLen = members.length; j < memLen; j++) {
				memName = members[j].name;
				obj = calcLabel(r, currAngle, memName);
				elem = paper.text(obj.x, obj.y, memName);
				elem.attr('font', opts.font).attr(obj.attr);
				elem.data('angle', currAngle);
				labelSet.push(elem);
				currAngle += unitAngle;
			}
		}
	};

	/**
	 * 画指标值圆点与连接线
	 */
	SmartRadar.prototype.drawValues = function(values) {
		var t = this, paper = t.paper, opts = t.options, store = t._store, len, i, j, mlen;
		var dataMap, points, ret, elemPath, elemCircle, elemText;
		var elems = store.elements, cset, tset, dataPoint = 'point';
		var clickHandler = opts.valuePointClickHandler, needClick = R.is(clickHandler, 'function');

		values = t._initValues(values);
		if (!values || !R.is(values.data, 'array')) {
			log('Parameter values is invalid!');
			return;
		}
		t.values = values;
		t._clearValueElements();
		//
		dataMap = t._calcDataMap(values);
		points = t._calcPoints(dataMap);

		// 指标值圆点的连接线
		ret = t._calcValueLines(points);
		elemPath = elems.valuePath = paper.path(ret.path);
		elemPath.attr(ret.attr);

		// 指标值圆点
		ret = t._calcValuePoints(points);
		cset = elems.valueCircleSet = paper.set();
		for (i = 0, len = ret.length; i < len; i++) {
			elemCircle = paper.circle(ret[i].x, ret[i].y, ret[i].r);
			elemCircle.attr(ret[i].attr);
			elemCircle.data(dataPoint, ret[i].point);
			cset.push(elemCircle);
		}
		if (needClick) {
			cset.forEach(function(item, index) {
				item.click(function(ev, x, y) {
					var srcElem = this, point = srcElem.data(dataPoint);
					var rowIndex = point.dataRowIndex, rowData = values.data[rowIndex];
					var args = [ rowData, point, srcElem ].concat([].slice.call(arguments, 0));
					clickHandler.apply(t, args);
				});
			});
		}

		// 指标值
		ret = t._calcValueNumbers(points);
		if (ret) {
			tset = elems.valueTextSet = paper.set();
			for (i = 0, len = ret.length; i < len; i++) {
				elemText = paper.text(ret[i].x, ret[i].y, ret[i].text);
				elemText.attr('font', opts.font).attr(ret[i].attr);
				elemText.data(dataPoint, ret[i].point);
				tset.push(elemText);
			}
		}

		// 修正文本重叠问题
		t._fixTextPosition();
	};

	/*
	 * 处理values设置：
	 * 1、正常详细设置{valueColIndex:0,memberColIndex:1,categoryColIndex:2,displayValueColIndex:3,data:[[],...]};
	 * 2、values=[80, 150, 60]; values=[[80,'A'],[150,'B'],[60,'C']]; 3、values={ data: [...] }.
	 */
	SmartRadar.prototype._initValues = function(values) {
		var t = this, format = function(values, data, vIndex, mIndex, cIndex, dIndex) {
			if (R.is(data, 'array') && data.length > 0) {
				if (!(R.is(data[0], 'array'))) {
					// data=[80, 150, 60] ==> data=[ [80, 'A'], [150, 'B'], [60, 'C'] ]
					var opts = t.options, len = data.length, mlen = opts.members.length, i, j;
					for (i = 0, j = 0; i < len && j < mlen; i++, j++) {
						data[i] = [ data[i], opts.members[j].name ];
					}
				}
				return {
					valueColIndex : isUndef(vIndex) ? 0 : vIndex,
					memberColIndex : isUndef(mIndex) ? 1 : mIndex,
					categoryColIndex : isUndef(cIndex) ? 2 : cIndex,
					displayValueColIndex : isUndef(dIndex) ? 3 : dIndex,
					data : data
				};
			}
			return values;
		};

		if (R.is(values, 'array')) { // array belongs object, check array first
			values = format(values, values);
		} else if (values && R.is(values, 'object')) {
			values = format(values, values.data, values.valueColIndex, values.memberColIndex,
					values.categoryColIndex, values.displayValueColIndex);
		}
		return values;
	};

	/*
	 * data array to map
	 */
	SmartRadar.prototype._calcDataMap = function(values) {
		var t = this, store = t._store, dataMap = {};
		var valueColIndex = values.valueColIndex;
		var memberColIndex = values.memberColIndex;
		var categoryColIndex = values.categoryColIndex;
		var displayValueColIndex = values.displayValueColIndex;
		var defName = store.OTHER_CATEGORY_NAME, cateMap = store.categoriesMap;
		var data = values.data, len = data.length, i, cname, mname;
		if (len < 1 || (valueColIndex >= len) || (memberColIndex >= len)) {
			log('Values property data is empty or invalid!');
			return dataMap;
		}
		if (isUndef(categoryColIndex) || categoryColIndex >= data[0].length) {
			cname = defName;
			categoryColIndex = -1;
		}
		if (isUndef(displayValueColIndex) || displayValueColIndex >= data[0].length) {
			displayValueColIndex = valueColIndex;
		}
		for (i = 0, len = data.length; i < len; i++) {
			if (categoryColIndex !== -1) {
				cname = data[i][categoryColIndex];
				if (!(cname in cateMap)) {
					cname = defName;
				}
			}
			if (!dataMap[cname]) {
				dataMap[cname] = {};
			}
			mname = data[i][memberColIndex];
			dataMap[cname][mname] = {
				dataRowIndex : i,
				value : data[i][valueColIndex],
				displayValue : data[i][displayValueColIndex]
			};
		}
		return dataMap;
	};

	/*
	 * 计算指标值投影在雷达上长度 -- widths: [60,10,50]; bounds: [0,30,50,100]; value: 10;
	 */
	SmartRadar.prototype._calcWidth = function(widths, bounds, value) {
		var minWidth = function() { // 最短
			return {
				index : 0,
				width : 0
			};
		}, maxWidth = function() { // 最长
			var total = 0, i, len = widths.length;
			for (i = 0; i < len; i++) {
				total += parseFloat(widths[i]);
			}
			return {
				index : len - 1,
				width : total
			};
		}, toNum = function(arr) { // 转换后确保数组元素为数字
			var ret = [], len = arr.length, i;
			for (i = 0; i < len; i++) {
				ret[i] = parseFloat(arr[i]);
			}
			return ret;
		}, v = parseFloat(value), wds = toNum(widths), bds = toNum(bounds);
		var wlen = wds.length, blen = bds.length, factor = bds[0] > bds[blen - 1] ? -1 : 1;
		if (factor * (v - bds[0]) <= 0) { // 在第1个边界值的左边
			return minWidth();
		} else if (factor * (v - bds[blen - 1]) >= 0) { // 在最后一个边界值的右边
			return maxWidth();
		} else {
			var index = 0, width = 0, i, j;
			for (i = 1, j = 0; i < blen && j < wlen; i++, j++) {
				if (factor * (v - bds[i]) < 0) {
					width += (v - bds[i - 1]) / (bds[i] - bds[i - 1]) * wds[j];
					break;
				} else {
					width += wds[j];
					if (v === bds[i]) {
						break;
					} else {
						++index;
					}
				}
			}
			return {
				index : index,
				width : width
			};
		}
	};

	/*
	 * point = { x : 0, y : 0, angle : 0, member: '', category : '', meshIndex : 0, displayValue :
	 * '0%' }
	 */
	SmartRadar.prototype._calcPoints = function(dataMap) {
		var t = this, opts = t.options, store = t._store;
		var points = [], unitAngle = store.unitAngle;
		var categories = opts.categories, meshes = opts.meshes, cateMap = store.categoriesMap;
		var hasVirMem = opts.virtualMember, offset = hasVirMem ? 1 : 0;
		var currAngle = hasVirMem ? (opts.startAngle - unitAngle) : opts.startAngle;
		var len, i, cateName, members, memLen, j, memName, point;
		var widths = [], bounds, currData, widthObj, pos;
		for (i = 0, len = meshes.length; i < len; i++) {
			widths.push(meshes[i].width);
		}
		for (i = 0, len = categories.length; i < len; i++) {
			cateName = categories[i].name;
			members = cateMap[cateName].members;
			currAngle += unitAngle * offset;
			for (j = 0, memLen = members.length; j < memLen; j++) {
				memName = members[j].name;
				currData = dataMap[cateName] && dataMap[cateName][memName];
				if (currData) {
					bounds = members[j].criticalValues;
					widthObj = t._calcWidth(widths, bounds, currData.value);
					pos = t.getPosition(widthObj.width, currAngle);
					point = {
						x : pos.x,
						y : pos.y,
						angle : currAngle,
						member : memName,
						category : cateName,
						meshIndex : widthObj.index,
						dataRowIndex : currData.dataRowIndex,
						displayValue : currData.displayValue
					};
					points.push(point);
				} // end if
				currAngle += unitAngle;
			} // end for j
		}
		return points;
	};

	/*
	 * 计算指标值圆点的连接线
	 */
	SmartRadar.prototype._calcValueLines = function(points) {
		var t = this, paper = t.paper, opts = t.options, pathData = [], len, i, point, attr;
		for (i = 0, len = points.length; i < len; i++) {
			point = points[i];
			pathData.push(i === 0 ? 'M' : 'L');
			pathData.push(point.x);
			pathData.push(point.y);
		}
		pathData.push('Z');
		attr = {
			'fill' : opts.pathFill,
			'stroke' : opts.pathStroke,
			'stroke-width' : opts.pathStrokeWidth,
			'stroke-linejoin' : 'round'
		};
		if (opts.pathFillOpacity !== 1) {
			attr['fill-opacity'] = opts.pathFillOpacity;
		}
		return {
			path : pathData.join(','),
			attr : attr
		};
	};

	/*
	 * 计算指标值圆点
	 */
	SmartRadar.prototype._calcValuePoints = function(points) {
		var t = this, paper = t.paper, opts = t.options, len, i, point, mesh, ret = [];
		for (i = 0, len = points.length; i < len; i++) {
			point = points[i];
			mesh = opts.meshes[point.meshIndex];
			ret.push({
				x : point.x,
				y : point.y,
				r : mesh.valuePointRadius,
				attr : {
					'fill' : mesh.valuePointFill,
					'stroke' : mesh.valuePointStroke,
					'stroke-width' : mesh.valuePointStrokeWidth,
					'title' : point.member + ': ' + point.displayValue
				},
				point : point
			});
		}
		return ret;
	};

	/*
	 * 计算指标值
	 */
	SmartRadar.prototype._calcValueNumbers = function(points) {
		var t = this, paper = t.paper, opts = t.options, store = t._store;
		var elems = store.elements, labelSet = elems.labelSet, ret = [], i, len;
		var numPos = opts.valueNumberPostion, isUnder = 'under_label' === numPos;
		var numFormat = opts.valueNumberFormat + '', regex = /@VALUE@/g, labelMap;
		if (!opts.drawValueNumbers) {
			return;
		}
		var calcValueDef = function(point) {
			var cx = opts.centerX, cy = opts.centerY, x = point.x, y = point.y;
			var eq = function(x, y) {
				return Math.round(x) === y;
			};
			if (eq(x, cx)) {
				y += 10 * Math.sin(R.rad(point.angle));
			}
			return {
				x : eq(x, cx) ? x + 2 : (x < cx ? x - 10 : x + 10),
				y : eq(y, cy) ? y - 2 : (y < cy ? y - 10 : y + 10),
				attr : {
					'text-anchor' : eq(x, cx) ? 'middle' : (x < cx ? 'end' : 'start'),
					'font-size' : opts.valueNumberFontSize,
					'fill' : opts.textFill
				}
			};
		}, calcValueUnderLabel = function(point) {
			var angle = point.angle, labelElem = labelMap[angle], box = labelElem.getBBox();
			return {
				x : box.x + 1 / 2 * box.width,
				y : box.y + 7 / 5 * box.height,
				attr : {
					'text-anchor' : 'middle',
					'font-size' : opts.valueNumberFontSize,
					'fill' : opts.textFill
				}
			};
		};
		if (isUnder) {
			labelMap = {};
			labelSet.forEach(function(item, index) {
				var angle = item.data('angle');
				labelMap[angle] = item;
			});
		}
		for (i = 0, len = points.length; i < len; i++) {
			var point = points[i], obj = isUnder ? calcValueUnderLabel(point) : calcValueDef(point);
			ret.push({
				x : obj.x,
				y : obj.y,
				text : numFormat.replace(regex, points[i].displayValue),
				attr : obj.attr,
				point : point
			});
		}
		return ret;
	};

	/*
	 * 修正文本重叠
	 */
	SmartRadar.prototype._fixTextPosition = function() {
		var t = this, paper = t.paper, opts = t.options, store = t._store, elems = store.elements;
		if (!opts.drawLabels || !opts.drawValueNumbers) {
			// 只画“指标名称”或只画“指标值”时重叠相对少，直接忽略
			return;
		}
		var numPos = opts.valueNumberPostion, isUnder = 'under_label' === numPos;
		var items = [], callback = function(item, index) {
			var point = item.data('point');
			if (point && 'angle' in point) {
				item.data('angle', point.angle);
			}
			items.push(item);
		}, sortByAngle = function(els, dir) {
			return els.sort(function(a1, a2) {
				var angle1 = a1.data('angle'), angle2 = a2.data('angle');
				var isV = dir === 'V', r = 100, offset = 0.001, p1, p2;
				p1 = t.getPosition(r, angle1);
				if (isV && a1.data('point')) {
					// Y轴方向加上修正值，防止“指标名称”和“指标值”算出来的Y值相等从而影响排序
					// 使“指标值”在垂直方向位于“指标名称”下方
					p1.y += offset;
				}
				p2 = t.getPosition(r, angle2);
				if (isV && a2.data('point')) {
					p2.y += offset;
				}
				return isV ? (p1.y - p2.y) : (p1.x - p2.x);
			});
		}, fix = function(els, dir) {
			var isV = dir === 'V', prop = isV ? 'y' : 'x', pv, len, i, j, box1, box2, angle, offset;
			els = sortByAngle(els, dir);

			// "under_label"时，最上方的“指标名称”和“指标值”应该都不与雷达辐射区域重叠
			if (isUnder && isV && els.length > 0) {
				box1 = els[0].getBBox();
				angle = els[0].data('angle');
				for (i = 1, len = els.length; i < len; i++) {
					if (els[i].data('angle') === angle) {
						box2 = els[i].getBBox();
						offset = box2.y - box1.y;
						pv = t.getPosition(store.outerRadius, angle).y - 10;
						els[i].attr('y', pv);
						els[0].attr('y', pv - offset);
						break;
					}
				}
			}

			for (i = 0, len = els.length; i < len - 1; i++) {
				box1 = els[i].getBBox();
				for (j = i + 1; j < len; j++) {
					box2 = els[j].getBBox();
					while (isBBoxIntersect(box1, box2)) {
						pv = els[j].attr(prop);
						els[j].attr(prop, pv + 1);
						box2 = els[j].getBBox();
					}
				}
			}
		};
		elems.labelSet.forEach(callback);
		elems.valueTextSet.forEach(callback);

		// 垂直方向，从上到下修正
		fix(items, 'V');

		// 水平方向，从左到右修正
		fix(items, 'H');
	};

	// export
	R.fn[exportName] = function(options, values) {
		return new SmartRadar(this, options, values);
	};

})(typeof Raphael === 'undefined' ? this.Raphael : Raphael);
