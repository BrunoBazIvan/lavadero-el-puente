/**
 * El isotipo de marca, en blanco y negro puro, listo para la térmica.
 *
 * Va embebido como data URI y no como `/gestion/logo.png` a propósito: el
 * comprobante se imprime desde un iframe con `srcdoc` que dispara `print()`
 * apenas carga, y una imagen que sale por red puede llegar tarde o no llegar
 * (mostrador sin internet). Embebida, el papel nunca sale sin logo. Son ~1 KB.
 *
 * Es 1 bit, sin grises: la térmica no tiene medios tonos, y un PNG en color
 * lo resuelve con tramado, que a este tamaño sale como una mancha sucia.
 * Los 176 px de lado se imprimen a 22 mm, o sea 1:1 en un cabezal de 203 dpi
 * (de ahí el `image-rendering: pixelated` en el CSS del ticket: reescalar
 * reintroduce los grises que evitamos acá).
 *
 * Regenerar desde `public/isotipo.png` si cambia la marca:
 *
 *     python3 - <<'PY'
 *     from PIL import Image
 *     import base64, io
 *     src = Image.open('public/isotipo.png').convert('RGBA')
 *     fondo = Image.new('RGBA', src.size, (255, 255, 255, 255))
 *     plano = Image.alpha_composite(fondo, src).convert('L').resize((176, 176), Image.LANCZOS)
 *     bn = plano.point(lambda v: 0 if v < 170 else 255).convert('1')
 *     buf = io.BytesIO(); bn.save(buf, format='PNG', optimize=True, bits=1)
 *     print(base64.b64encode(buf.getvalue()).decode())
 *     PY
 *
 * El umbral 170 es el que conserva el dibujo de la ola. Más alto la rellena
 * hasta dejar una mancha negra; más bajo se come la cresta.
 */
export const LOGO_TICKET =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAALAAAACwAQAAAACHzNnzAAADw0lEQVR42q2XTY7kRBCFv0wbXIuWXBKbWVF1A0biAOWj9I4r' +
  'sABVigNwhBGcBM8JqCMYaSRYehAS7sblYJF/kS6XUKGpRavzKfwiMn5eZhph62fzvz9oXMJvAc5xIQnugeoGngE4reEBtLkJ' +
  'kZjgqYzkJSyPZSRDWFUliUlWmuQKz37daZIRM/pl60m89SUlYdIkfcrFqyJZoAokIS8WYAEi3GfrUWW0zdYanrLLQcGvGe51' +
  'WRL3UpTxHLlLuI8kc4K+i45s3jBQ9TEslWxoJ2gid4Y/NoHSlvHt+xCAiG43M/p02LiBpnWA/AjOk/iv3jgAfnb0Hp51FcfO' +
  'RxDTenrvuUZazx3S+gsA85PfncgAPZxDKELjrQc45u7Dzd6l38272AndkhpigA9QyULNW/HcPgJfgPEgEyJCqE3rvm1ERE4y' +
  'c87wqZ9OcbZOIjbsvTOf9XouxNdG3qcpc4fYsRg1t90INlYy1+KYR8pS5wpNYH2manYJ3s2Ar3sr+Td/nVwWotGB9cXYa3wB' +
  'pAc4KBL5O5H4ob6aI8AuBejrW/PbrSjxopyIS7PsshYoa3HA1SkSA/AnAD+pEaqiiIX2FgVrobEhMrgSpSVx74C/UFvIkcQJ' +
  'HzK8zyHESYtqiRa3RHLVaQ0knRplyX+LmT1HElPMbB9JypkdIklVzGwbSWo1I7E6DnaF1EyRe6+lJo4QHOGPDPlJO0JXaN6C' +
  '70ETyqsOAGRaxQdnEUvNk0pUcvkPX9VlID3UvMrHL5TmRevGXeCisQGQGSpx2uchTLGRg0xFrrwUnAtZbkUsOOjBuNWhGw6m' +
  '5yKFIhOmPDcaEQsNXwI8aZI6tYDVmc0Lc+ecdyrhCu62rY/b8B3uvWpOBe8eIqn/y9pp2D7EfQc2n4LkQdh9Uu4PD1nX96xR' +
  'up2wb2TTeti2/lX+93YyyUVzL2oCH+E+PpSTTsPLtrXWFJOjfdnlHdj13e6+S1PAY2E9FAIdGGw26gvrNxsVBvn9pjitiE06' +
  'InpuLZ9v7B2brGatCZa6u90kFjukAhabH9dhd2CEegZQVfXC8f1tIFjoOtSZ68fWRmeXMtcigynvyeHit5cuXgmyOAXpLcVe' +
  'aqgRs9E+9qbVwK40N4rq6jwjXYYLzQ0f25XmqkN7f1Ng7Epc8Z1gIVVTybhdnwohAFlHmO8+OsJq+2HTZGsdyi4Hr0PZZ1iH' +
  '8qwc92rE1EMy+ywuftnnk5607PNtoWx9SV3eTNVn+kWb77NRlFwpluVLt1nDi3ou6lf0ULyis54YPZpm++H+L96Qza/brhEt' +
  'AAAAAElFTkSuQmCC';
