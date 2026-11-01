"""Renderiza gráficos de prueba y una transición a partir de geometría y tipografía local."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
import subprocess

ROOT = Path(__file__).resolve().parent.parent
W, H = 1920, 1080
BLUE, RED, YELLOW, GREEN = '#4285f4', '#ea4335', '#f9ab00', '#34a853'
INK, MUTED = '#20324a', '#607086'
FONT = ROOT / '01_Identidad/fuentes/GoogleSans-Regular.ttf'
BOLD = ROOT / '01_Identidad/fuentes/GoogleSans-Bold.ttf'
MONO = ROOT / '01_Identidad/fuentes/GoogleSansMono-Regular.ttf'

def font(size, bold=False, mono=False):
    return ImageFont.truetype(str(MONO if mono else BOLD if bold else FONT), size)

def spectrum(draw, y=0, height=7):
    for i, color in enumerate([BLUE, RED, YELLOW, GREEN]):
        draw.rectangle((i*480, y, (i+1)*480-1, y+height-1), fill=color)

for track in [1, 2]:
    image = Image.new('RGB', (W, H), '#132238')
    d = ImageDraw.Draw(image)
    for x in range(-H, W, 120):
        d.line((x, H, x+H, 0), fill='#1a2e47', width=2)
    d.rounded_rectangle((100, 100, 1820, 980), radius=48, outline='#334a65', width=3)
    d.rounded_rectangle((821, 230, 1099, 426), radius=35, outline='#a3c3f2', width=13)
    d.polygon([(1099, 282), (1175, 247), (1175, 410), (1099, 375)], fill='#a3c3f2')
    d.ellipse((909, 284, 1011, 386), outline='#a3c3f2', width=10)
    d.text((W/2, 520), 'Vista de cámara', font=font(140, bold=True), fill='#fff', anchor='mt')
    d.text((W/2, 712), 'Aquí se verá el ponente', font=font(65), fill='#a8bdd6', anchor='mt')
    d.text((W/2, 865), f'SEÑAL DE PRUEBA · TRACK {track}', font=font(36, mono=True), fill='#9abdf0', anchor='mt')
    spectrum(d)
    image.save(ROOT / f'02_Graficos/t{track}_prueba_camara.png')

    image = Image.new('RGB', (W, H), '#f7f9fc')
    d = ImageDraw.Draw(image)
    spectrum(d)
    d.text((120, 100), f'VISTA DE PRUEBA · TRACK {track}', font=font(31, mono=True), fill=MUTED)
    d.text((120, 295), 'Construimos', font=font(140, bold=True), fill=INK)
    d.text((120, 455), 'lo que viene.', font=font(140, bold=True), fill=INK)
    d.text((126, 680), 'Ideas, tecnología y comunidad.', font=font(51), fill=MUTED)
    d.text((125, 940), 'DevFest Arequipa 2026', font=font(38), fill=INK)
    d.text((1790, 947), 'Diapositivas de demostración', font=font(27), fill=MUTED, anchor='rt')
    d.rounded_rectangle((1270, 270, 1760, 760), radius=100, fill='#e8f0fe')
    d.rounded_rectangle((1340, 340, 1690, 690), radius=72, fill='#fff', outline='#ccd9ec', width=3)
    d.line([(1455, 440), (1385, 510), (1455, 580)], fill=BLUE, width=24, joint='curve')
    d.line([(1575, 440), (1645, 510), (1575, 580)], fill=GREEN, width=24, joint='curve')
    d.line((1540, 422, 1490, 598), fill=YELLOW, width=18)
    d.ellipse((1718, 240, 1762, 284), fill=RED)
    d.ellipse((1248, 730, 1278, 760), fill=GREEN)
    image.save(ROOT / f'02_Graficos/t{track}_prueba_diapositivas.png')

frames = ROOT / '09_Pruebas/Revision_Visual_v3/stinger-frames'
frames.mkdir(parents=True, exist_ok=True)

def ease(value):
    value=max(0, min(1, value))
    return 1 - (1-value)**3

for index in range(36):
    t=index/35
    offset=-W*(1-ease(t/.46)) if t<.46 else 0 if t<=.57 else W*ease((t-.57)/.43)
    x=round(offset)
    image=Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d=ImageDraw.Draw(image)
    d.rectangle((x, 0, x+W-1, H-1), fill='#f7f9fc')
    for i,color in enumerate([BLUE,RED,YELLOW,GREEN]):
        d.rectangle((x+i*480, 0, x+(i+1)*480-1, 9), fill=color)
    # Glifos de código vectoriales: sin modificar marcas oficiales.
    d.line([(x+840, 420), (x+720, 540), (x+840, 660)], fill=BLUE, width=54, joint='curve')
    d.line([(x+1080, 420), (x+1200, 540), (x+1080, 660)], fill=GREEN, width=54, joint='curve')
    d.line((x+1012, 390, x+918, 690), fill=YELLOW, width=34)
    d.ellipse((x+1240, 340, x+1264, 364), fill=RED)
    if index in [0,35]:
        image=Image.new('RGBA', (W,H), (0,0,0,0))
    image.save(frames / f'frame-{index:03d}.png')

subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-framerate','30','-i',str(frames/'frame-%03d.png'),'-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-crf','18','-b:v','0','-an',str(ROOT/'04_Transiciones/devfest_estudio_v3.webm')],check=True)
assert Image.open(frames/'frame-000.png').getchannel('A').getextrema()==(0,0)
assert Image.open(frames/'frame-018.png').getchannel('A').getextrema()==(255,255)
assert Image.open(frames/'frame-035.png').getchannel('A').getextrema()==(0,0)
print('Listos: 4 gráficos de prueba 1080p y transición VP9 con alfa; cambio en 600 ms.')
