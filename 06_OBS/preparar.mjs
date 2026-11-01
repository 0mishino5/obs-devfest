import {prepare} from './preparacion.mjs';
import {assertHost} from './plataforma.mjs';
try {
  assertHost();
  const result = prepare({install:process.argv.includes('--instalar')});
  if (result.backup) console.log('Respaldo local: '+result.backup);
  console.log(`Rutas y fuentes listas para ${result.platform}. ${result.tracks} tracks preparados${process.argv.includes('--instalar')?' e instalados':''}.`);
  console.log('Selecciona el perfil y la colección del track en OBS.');
} catch (e) { console.error(e.message); process.exitCode=1; }
