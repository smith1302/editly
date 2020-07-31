const { fabric } = require('fabric');
const fileUrl = require('file-url');
const nodeCanvas = require('canvas');

const { createCanvas } = nodeCanvas;

const { canvasToRgba } = require('./shared');
const { getRandomGradient, getRandomColors } = require('../colors');
const { easeOutExpo, easeInOutCubic } = require('../transitions');

function fabricCanvasToRgba(canvas) {
  // https://github.com/fabricjs/fabric.js/blob/26e1a5b55cbeeffb59845337ced3f3f91d533d7d/src/static_canvas.class.js
  // https://github.com/fabricjs/fabric.js/issues/3885
  const internalCanvas = fabric.util.getNodeCanvas(canvas.lowerCanvasEl);
  const ctx = internalCanvas.getContext('2d');

  // require('fs').writeFileSync(`${Math.floor(Math.random() * 1e12)}.png`, internalCanvas.toBuffer('image/png'));
  // throw new Error('abort');

  return canvasToRgba(ctx);
}

function createFabricCanvas({ width, height }) {
  return new fabric.StaticCanvas(null, { width, height });
}

async function renderFabricCanvas(canvas) {
  canvas.renderAll();
  const rgba = fabricCanvasToRgba(canvas);
  canvas.clear();
  // canvas.dispose();
  return rgba;
}

async function rgbaToFabricImage({ width, height, rgba }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  // https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/putImageData
  ctx.putImageData(new nodeCanvas.ImageData(Uint8ClampedArray.from(rgba), width, height), 0, 0);
  // https://stackoverflow.com/questions/58209996/unable-to-render-tiff-images-and-add-it-as-a-fabric-object
  return new fabric.Image(canvas);
}

async function createFabricFrameSource(func, { width, height, ...rest }) {
  const onInit = async () => func(({ width, height, fabric, ...rest }));

  const { onRender = () => {}, onClose = () => {} } = await onInit() || {};

  return {
    readNextFrame: onRender,
    close: onClose,
  };
}

async function imageFrameSource({ verbose, params, width, height }) {
  if (verbose) console.log('Loading', params.path);

  const imagePath = params.path.includes('http') ? params.path : fileUrl(params.path);
  const imgData = await new Promise((resolve) => fabric.util.loadImage(imagePath, resolve));
  const { zoomDirection = 'in', zoomAmount = 0.1, resizeMode='contain', containerRect = {x:0, y:0, width: width, height: height}} = params;

  const getImg = () => new fabric.Image(imgData, {
    originX: 'center',
    originY: 'center',
    left: containerRect.x + containerRect.width / 2,
    top: containerRect.y + containerRect.height / 2,
    centeredScaling: true,
  });

  // Blurred version
  let blurredImg = null;
  if (resizeMode == 'contain') {
    blurredImg = getImg();
    blurredImg.filters = [new fabric.Image.filters.Resize({ scaleX: 0.01, scaleY: 0.01 })];
    blurredImg.applyFilters();

    if (blurredImg.height > blurredImg.width) blurredImg.scaleToWidth(containerRect.width);
    else blurredImg.scaleToHeight(containerRect.height);
  }


  async function onRender(progress, canvas) {

    const img = getImg();

    let scaleFactor = 1;
    if (zoomDirection === 'in') scaleFactor = (1 + progress * zoomAmount);
    else if (zoomDirection === 'out') scaleFactor = (1 + zoomAmount * (1 - progress));

    if (resizeMode == 'contain') {
      if (img.height > img.width) img.scaleToHeight(containerRect.height * scaleFactor);
      else img.scaleToWidth(containerRect.width * scaleFactor);
    } else {
      const mW = containerRect.width / img.width;
      const mH = containerRect.height / img.height;
      if (mW > mH) img.scaleToWidth(containerRect.width * scaleFactor);
      else img.scaleToHeight(containerRect.height * scaleFactor);
      
      //if (containerRect.height > containerRect.width) img.scaleToWidth(containerRect.height * scaleFactor);
      //else img.scaleToHeight(containerRect.width * scaleFactor);
    }

    if (blurredImg) canvas.add(blurredImg);
    canvas.add(img);
  }

  function onClose() {
    if (blurredImg) blurredImg.dispose();
    // imgData.dispose();
  }

  return { onRender, onClose };
}

async function fillColorFrameSource({ params, width, height }) {
  const { color } = params;

  const randomColor = getRandomColors(1)[0];

  async function onRender(progress, canvas) {
    const rect = new fabric.Rect({
      left: 0,
      right: 0,
      width,
      height,
      fill: color || randomColor,
    });
    canvas.add(rect);
  }

  return { onRender };
}

function getRekt(width, height) {
  // width and height with room to rotate
  return new fabric.Rect({ originX: 'center', originY: 'center', left: width / 2, top: height / 2, width: width * 2, height: height * 2 });
}

async function radialGradientFrameSource({ width, height, params }) {
  const { colors: inColors } = params;

  const randomColors = getRandomGradient();

  async function onRender(progress, canvas) {
    // console.log('progress', progress);

    const max = Math.max(width, height);

    const colors = inColors && inColors.length === 2 ? inColors : randomColors;

    const r1 = 0;
    const r2 = max * (1 + progress) * 0.6;

    const rect = getRekt(width, height);

    const cx = 0.5 * rect.width;
    const cy = 0.5 * rect.height;

    rect.setGradient('fill', {
      type: 'radial',
      r1,
      r2,
      x1: cx,
      y1: cy,
      x2: cx,
      y2: cy,
      colorStops: {
        0: colors[0],
        1: colors[1],
      },
    });

    canvas.add(rect);
  }

  return { onRender };
}

async function linearGradientFrameSource({ width, height, params }) {
  const { colors: inColors } = params;

  const randomColors = getRandomGradient();
  const colors = inColors && inColors.length === 2 ? inColors : randomColors;

  async function onRender(progress, canvas) {
    const rect = getRekt(width, height);

    rect.setGradient('fill', {
      x1: 0,
      y1: 0,
      x2: width,
      y2: height,
      colorStops: {
        0: colors[0],
        1: colors[1],
      },
    });

    rect.rotate(progress * 30);
    canvas.add(rect);
  }

  return { onRender };
}

async function subtitleFrameSource({ width, height, params }) {
  const { text, textColor = '#ffffff', backgroundColor = 'rgba(0,0,0,0.3)', fontFamily = 'sans-serif', delay = 0, speed = 1 } = params;

  async function onRender(progress, canvas) {
    const easedProgress = easeOutExpo(Math.max(0, Math.min((progress - delay) * speed, 1)));

    const min = Math.min(width, height);
    const padding = 0.05 * min;

    const textBox = new fabric.Textbox(text, {
      fill: textColor,
      fontFamily,

      fontSize: min / 20,
      textAlign: 'left',
      width: width - padding * 2,
      originX: 'center',
      originY: 'bottom',
      left: (width / 2) + (-1 + easedProgress) * padding,
      top: height - padding,
      opacity: easedProgress,
    });

    const rect = new fabric.Rect({
      left: 0,
      width,
      height: textBox.height + padding * 2,
      top: height,
      originY: 'bottom',
      fill: backgroundColor,
      opacity: easedProgress,
    });

    canvas.add(rect);
    canvas.add(textBox);
  }

  return { onRender };
}

async function titleFrameSource({ width, height, params }) {
  const { text, textColor = '#ffffff', fontFamily = 'sans-serif', position = 'center' } = params;

  async function onRender(progress, canvas) {
    // console.log('progress', progress);

    const min = Math.min(width, height);

    const fontSize = Math.round(min * 0.1);

    const scale = (1 + progress * 0.2).toFixed(4);

    const textBox = new fabric.Textbox(text, {
      fill: textColor,
      fontFamily,
      fontSize,
      textAlign: 'center',
      width: width * 0.8,
    });

    const textImage = await new Promise((r) => textBox.cloneAsImage(r));

    let originY = 'center';
    let top = height / 2;
    if (position === 'top') {
      originY = 'top';
      top = height * 0.05;
    } else if (position === 'bottom') {
      originY = 'bottom';
      top = height;
    }

    textImage.set({
      originX: 'center',
      originY,
      left: width / 2,
      top,
      scaleX: scale,
      scaleY: scale,
    });
    canvas.add(textImage);
  }

  return { onRender };
}

async function newsTitleFrameSource({ width, height, params }) {
  const { text, textColor = '#ffffff', backgroundColor = '#d02a42', fontFamily = 'sans-serif', delay = 0, speed = 1 } = params;

  async function onRender(progress, canvas) {
    const min = Math.min(width, height);

    const fontSize = Math.round(min * 0.05);

    const easedBgProgress = easeOutExpo(Math.max(0, Math.min((progress - delay) * speed * 3, 1)));
    const easedTextProgress = easeOutExpo(Math.max(0, Math.min((progress - delay - 0.02) * speed * 4, 1)));
    const easedTextOpacityProgress = easeOutExpo(Math.max(0, Math.min((progress - delay - 0.07) * speed * 4, 1)));

    const top = height * 0.08;

    const paddingV = 0.07 * min;
    const paddingH = 0.03 * min;

    const textBox = new fabric.Text(text, {
      top,
      left: paddingV + (easedTextProgress - 1) * width,
      fill: textColor,
      opacity: easedTextOpacityProgress,
      fontFamily,
      fontSize,
      charSpacing: width * 0.1,
    });

    const bgWidth = textBox.width + (paddingV * 2);
    const rect = new fabric.Rect({
      top: top - paddingH,
      left: (easedBgProgress - 1) * bgWidth,
      width: bgWidth,
      height: textBox.height + (paddingH * 2),
      fill: backgroundColor,
    });

    canvas.add(rect);
    canvas.add(textBox);
  }

  return { onRender };
}

async function titleBarFrameSource({ width, height, params }) {
  const {text = '', barHeight = 100, textColor = '#ffffff', barColor = '#000000'} = params;

  async function onRender(progress, canvas) {
    const padding = 0.04 * barHeight;
    const fontSize = (width / 14) - (Math.max(0, (text.length - 15)) * 0.45);
    const textBox = new fabric.Textbox(text, {
      fill: textColor,
      fontFamily: 'sans-serif',
      fontSize: fontSize,
      fontWeight: 'bold',
      textAlign: 'center',
      left: width / 2,
      top: barHeight / 2,
      width: width - padding * 2,
      originX: 'center', 
      originY: 'center',
    });

    const rect = new fabric.Rect({
      left: -1,
      top: -1,
      width: width + 1,
      height: barHeight + 1,
      fill: barColor,
    });

    canvas.add(rect);
    canvas.add(textBox);
  }

  function onClose() {
    // Cleanup if you initialized anything
  }

  return { onRender, onClose };
}

async function reviewFrameSource({ width, height, params }) {
  const {text, rating, padding, containerRect = {x:0, y:0, width: width, height: height}, dateString = ''} = params;
  const backgroundColor = '#ffffff';
  const textColor = '#333333'
  const fontFamily = 'sans-serif';
  const cornerRadius = 0.01 * containerRect.width;
  const defaultFontSize = containerRect.width / 13;
  
  async function onRender(progress, canvas) {
    function slideInOut(startSlideIn, dur, startSlideOut) {
      if (progress < startSlideOut) {
        return (easeOutExpo(Math.min(1, Math.max(0, (progress - startSlideIn) / dur)))) / 2;
      }
      return 0.5 + (easeInOutCubic(Math.min(1, Math.max(0, (progress - startSlideOut) / dur)))) / 2;
    }

    const centerX = containerRect.x + containerRect.width / 2;
    const centerY = containerRect.y + (containerRect.height / 2);
    const visibleRectWidth = containerRect.width - padding * 2;
    const textGroupWidth = visibleRectWidth - padding * 2;

    const easedProgress = slideInOut(0.2, 0.06, 0.8);
    const animOffsetX = containerRect.width - (containerRect.width * 2) * easedProgress;

    // If there's no review text, center align everything or it looks funny
    const hasText = text.length > 0;

    const verified = new fabric.Textbox("Verified Review", {
      fill: textColor,
      fontFamily,
      fontSize: containerRect.width / 29,
      originX: 'left',
      originY: 'top',
      textAlign: hasText ? 'left' : 'center',
      left: 0,
      top: 0,
      width: textGroupWidth,
      opacity: 0.6
    });
    const verifiedBottom = verified.top + verified.height;

    // Make shrink text if there's a lot of it
    let textBox = null;
    if (hasText) {
      const shrinkThreshold = 70;
      const shrinkRate = 450; // Lower = faster shrinkage
      const charDiff = Math.max(0, text.length - shrinkThreshold);
      const adjustment = 1 - (charDiff / shrinkRate);
      const fontSize = defaultFontSize * adjustment;
      textBox = new fabric.Textbox(text, {
        fill: textColor,
        fontFamily,
        fontSize: fontSize,
        fontWeight: 'bold',
        textAlign: 'left',
        originX: 'left',
        originY: 'top',
        left: 0,
        top: verifiedBottom + padding / 2,
        width: textGroupWidth,
      });
    }

    const starsTop = textBox ? (textBox.top + textBox.height) : verifiedBottom;
    const starString = new Array(rating + 1).join('★');
    let starsOptions = {
      fill: '#ffc107',
      fontFamily,
      fontSize: hasText ? containerRect.width / 17 : containerRect.width / 10,
      fontWeight: 'bold',
      textAlign: hasText ? 'left' : 'center',
      left: 0,
      top: starsTop + padding / 2,
      originX: 'left', 
      originY: 'top',
    };
    if (!hasText) starsOptions.width = textGroupWidth;
    const stars = new fabric.Textbox(starString, starsOptions);

    const showInlineDate = hasText;
    const dateOriginY = showInlineDate ? 'center' : 'top';
    const dateTextAlignment = showInlineDate ? 'left' : 'center';
    const dateStartX = showInlineDate ? (stars.width + padding / 3) : 0;
    const dateStartY = showInlineDate ? (stars.top + stars.height / 2) : (stars.top + stars.height + padding / 2);
    const dateDisplay = showInlineDate ? `- ${dateString}` : dateString;
    const date = new fabric.Textbox(dateDisplay, {
      fill: textColor,
      fontFamily,
      fontSize: containerRect.width / 29,
      textAlign: dateTextAlignment,
      left: dateStartX,
      top: dateStartY,
      width: textGroupWidth - dateStartX,
      originX: 'left', 
      originY: dateOriginY,
      opacity: 0.6
    });

    const textGroupItems = [verified];
    if (textBox) textGroupItems.push(textBox);
    textGroupItems.push(stars, date);

    var textGroup = new fabric.Group(textGroupItems, {
      originX: 'center',
      originY: 'center',
      left: centerX,
      top: centerY,
      width: textGroupWidth,
    });

    const textBoundingRect = textGroup.getBoundingRect();
    // Set the BG height to be a minimum of 40% of the full height
    const bgHeight = Math.max(containerRect.height * 0.3, textBoundingRect.height + padding * 2);
    var background = new fabric.Rect({
      top: textBoundingRect.top - (bgHeight / 2) + (textBoundingRect.height / 2),
      left: textBoundingRect.left - padding,
      width: textBoundingRect.width + padding * 2,
      height: bgHeight,
      fill: backgroundColor,
      rx: cornerRadius,
      ry: cornerRadius,
      shadow: "1px 1px 4px rgba(0,0,0,0.5)"
    });

    var group = new fabric.Group([background, textGroup], {
      originX: 'center',
      originY: 'center',
      left: centerX + animOffsetX,
      top: centerY,
    });

    canvas.add(group);
  }

  function onClose() {
    // Cleanup if you initialized anything
  }

  return { onRender, onClose };
}

async function createCustomCanvasFrameSource({ width, height, params }) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  const { onClose, onRender } = await params.func(({ width, height, canvas }));

  async function readNextFrame(progress) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    await onRender(progress);
    // require('fs').writeFileSync(`${new Date().getTime()}.png`, canvas.toBuffer('image/png'));
    // I don't know any way to draw a node-canvas as a layer on a fabric.js canvas, other than converting to rgba first:
    return canvasToRgba(context);
  }

  return {
    readNextFrame,
    // Node canvas needs no cleanup https://github.com/Automattic/node-canvas/issues/1216#issuecomment-412390668
    close: onClose,
  };
}

async function customFabricFrameSource({ canvas, width, height, params }) {
  return params.func(({ width, height, fabric, canvas }));
}

function registerFont(...args) {
  fabric.nodeCanvas.registerFont(...args);
}

module.exports = {
  registerFont,
  createFabricFrameSource,
  createCustomCanvasFrameSource,
  customFabricFrameSource,
  subtitleFrameSource,
  titleFrameSource,
  newsTitleFrameSource,
  fillColorFrameSource,
  radialGradientFrameSource,
  linearGradientFrameSource,
  imageFrameSource,
  reviewFrameSource,
  titleBarFrameSource,
  createFabricCanvas,
  renderFabricCanvas,
  rgbaToFabricImage,
};
