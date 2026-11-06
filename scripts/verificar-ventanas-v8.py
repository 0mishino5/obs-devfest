from PIL import Image
import json, math
from pathlib import Path
root=Path.cwd()
report=[]
for track in (1,2):
    for frame in ('marco_mixta','marco_preguntas','marco_camara','marco_diapositivas'):
        rects=[(136,142,1648,927)] if frame in ('marco_camara','marco_diapositivas') else [(24,320,600,337.5),(648,148,1248,702)]
        image=Image.open(root/f'02_Graficos/t{track}_{frame}.png').convert('RGBA')
        alpha=image.getchannel('A')
        for x,y,w,h in rects:
            area=(math.ceil(x),math.ceil(y),math.floor(x+w),math.floor(y+h))
            assert alpha.crop(area).getextrema()==(0,0),(track,frame,area,alpha.crop(area).getextrema())
        report.append({'track':track,'frame':frame,'contentFullyTransparent':True})
(root/'09_Pruebas/Revision_v8/ventanas.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('8 marcos: ventanas de cámara y diapositivas completamente transparentes.')
