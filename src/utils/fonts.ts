import { Metrics } from './metrics.js';
import { Style } from '../text/style.js';
import { RunStyle } from '../text/run-style.js';

export class Fonts {
  private static _initialized = false;
  private static _foundFonts: string[] = [];
  private static _notFoundFonts: string[] = [];
  private static testString = 'mmmmmllnnrr';
  private static testSize = 72;
  private static baseline: number | undefined = undefined;
  
  /**
   * List of available fonts on this device.
   */
  public static availableFonts(): string[] {
    if (!Fonts._initialized) {
      Fonts._initialized = true;
      const families = [
        'Arial',
        'Helvetica',
        'Times',
        'Courier',
        'Verdana',
        'Georgia',
        'Garamond',
        'Comic Sans MS',
        'Trebuchet MS',
        'Arial Black',
        'Impact'
      ];
      const style = new Style();
      style.runStyle = new RunStyle();
      style.runStyle.updateFont('Times New Roman', Fonts.testSize);
      Fonts.baseline = Metrics.getTextWidth(Fonts.testString, style);
      Fonts._foundFonts.push('Times New Roman');
      families.forEach(family => {
        Fonts.testFont(family);
      });
    }
    return Fonts._foundFonts;
  }

  public static tryAddFont(family: string): boolean {
    const isAvailable = Fonts.availableFonts().indexOf(family) !== -1;
    if (!isAvailable) {
      const isNotAvailable = Fonts._notFoundFonts!.indexOf(family) !== -1;
      if (!isNotAvailable) {
        return Fonts.testFont(family);
      } 
      return false;
    }
    return true;
  }

  public static tryAddFonts(families: string[]): number {
    let index = Math.max(0, families.length - 1);
    while(index >= 0) {
      if (this.tryAddFont(families[index])) {
        return index;
      }
      index++;
    }
    return -1;
  }

  private static testFont(family: string): boolean {
    const style = new Style();
    style.runStyle = new RunStyle();
    style.runStyle.updateFont(family, Fonts.testSize);
    const width = Metrics.getTextWidth(Fonts.testString, style);
    if (width !== Fonts.baseline) {
      Fonts._foundFonts.push(family);
      return true;
    } else {
      Fonts._notFoundFonts.push(family);
      return false;
    }
  }
}
