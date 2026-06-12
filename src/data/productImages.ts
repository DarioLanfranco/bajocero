import type { ImageMetadata } from 'astro';
import burguerImg from '../assets/images/burguer.webp';
import empanadaImg from '../assets/images/empanada.webp';
import milanesaImg from '../assets/images/milanesa.webp';
import ensaladacesarImg from '../assets/images/ensaladacesar.webp';
import medialunaImg from '../assets/images/medialuna.webp';
import merluzaImg from '../assets/images/merluza.webp';
import noisetteImg from '../assets/images/noisette.webp';
import raviolesImg from '../assets/images/ravioles.webp';

export const productImageMap: Record<string, ImageMetadata> = {
  'hamburguesa-angus': burguerImg,
  'empanadas-x6': empanadaImg,
  'milanesa-de-res': milanesaImg,
  'ensalada-cesar': ensaladacesarImg,
  'medialunas-x6': medialunaImg,
  'merluza-en-posta': merluzaImg,
  'papas-noisette': noisetteImg,
  'pasta-al-huevo': raviolesImg,
};
