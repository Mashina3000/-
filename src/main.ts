import './styles.css';
import { startBackground } from './ui/background';
import { back, go, register } from './ui/router';
import { levelsScreen } from './ui/screens/levels';
import { mainScreen } from './ui/screens/main';
import { settingsScreen } from './ui/screens/settings';
import { skinsScreen } from './ui/screens/skins';
import { editorScreen } from './ui/screens/editor';

register('main', mainScreen);
register('levels', levelsScreen);
register('skins', skinsScreen);
register('settings', settingsScreen);
register('editor', editorScreen);

startBackground();
go('main', 0);
addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });
