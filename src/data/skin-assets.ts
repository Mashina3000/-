/** Внешние иконки скинов. Порядок соответствует файлам в assets/icons. */
export const CUSTOM_SKINS = [
  { name: 'Неоновый кибер', src: './assets/icons/01_neon_cyber.png' },
  { name: 'Огненный куб', src: './assets/icons/02_fire_cube.png' },
  { name: 'Ледяной кристалл', src: './assets/icons/03_ice_crystal.png' },
  { name: 'Minecraft', src: './assets/icons/04_minecraft_grass.png' },
  { name: 'Теневой демон', src: './assets/icons/05_shadow_demon.png' },
  { name: 'Золотая корона', src: './assets/icons/06_golden_crown.png' },
  { name: 'Океанический дракон', src: './assets/icons/07_ocean_dragon.png' },
  { name: 'Галактика', src: './assets/icons/08_galaxy_cube.png' },
  { name: 'Милый кот', src: './assets/icons/09_kawaii_cat.png' },
  { name: 'Ниндзя', src: './assets/icons/10_ninja_cube.png' },
  { name: 'Стимпанк-меха', src: './assets/icons/11_steampunk_mecha.png' },
  { name: 'Хэллоуин', src: './assets/icons/12_pumpkin_halloween.png' },
  { name: 'Ретро-пиксель', src: './assets/icons/13_retro_pixel.png' },
  { name: 'Меха-ядро', src: './assets/icons/14_mecha_core.png' },
  { name: 'Мятный призрак', src: './assets/icons/15_mint_ghost.png' },
  { name: 'Тёмный дракон', src: './assets/icons/16_dark_dragon.png' },
  { name: 'Призматический кристалл', src: './assets/icons/17_prism_crystal.png' },
  { name: 'Лесной голем', src: './assets/icons/18_forest_golem.png' },
  { name: 'Биоопасность', src: './assets/icons/19_biohazard.png' },
  { name: 'Лунный кот', src: './assets/icons/20_moon_cat.png' },
  { name: 'Лавовый демон', src: './assets/icons/21_lava_demon.png' },
  { name: 'Карамельный кот', src: './assets/icons/22_candy_cat.png' },
  { name: 'Синий робот', src: './assets/icons/23_blue_robot.png' },
  { name: 'Пиксельный призрак', src: './assets/icons/24_pixel_ghost.png' },
  { name: 'Огненный куб — детальный', src: './assets/icons/25_fire_cube_detail.png' },
  { name: 'Неоновый куб — детальный', src: './assets/icons/26_neon_cube_detail.png' },
] as const;

export const TOTAL_SKINS = 12 + CUSTOM_SKINS.length;
export function customSkinSource(icon: number): string | undefined {
  return CUSTOM_SKINS[icon - 12]?.src;
}
