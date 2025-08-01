<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { getDefaultHue, getHue, setHue } from "@utils/setting-utils";

let hue = getHue();
const defaultHue = getDefaultHue();

function resetHue() {
	hue = getDefaultHue();
}

$: if (hue || hue === 0) {
	setHue(hue);
}
</script>

<div id="display-setting" class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4">
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]"
        >
            {i18n(I18nKey.themeColor)}
            <button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md  active:scale-90"
                    class:opacity-0={hue === defaultHue} class:pointer-events-none={hue === defaultHue} on:click={resetHue}>
                <div class="text-[var(--btn-content)]">
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                </div>
            </button>
        </div>
        <div class="flex gap-1">
            <div id="hueValue" class="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-[var(--btn-content)]">
                {hue}
            </div>
        </div>
    </div>
    <div class="w-full h-6 px-1 rounded select-none rainbow-gradient">
        <input aria-label={i18n(I18nKey.themeColor)} type="range" min="0" max="360" bind:value={hue}
               class="slider" id="colorSlider" step="5" style="width: 100%">
    </div>
</div>


<style lang="stylus">
    /* 彩虹渐变样式 */
    .rainbow-gradient
      /* 亮色模式 - 较深的颜色 */
      background linear-gradient(to right, oklch(0.65 0.15 0), oklch(0.65 0.15 30), oklch(0.65 0.15 60), oklch(0.65 0.15 90), oklch(0.65 0.15 120), oklch(0.65 0.15 150), oklch(0.65 0.15 180), oklch(0.65 0.15 210), oklch(0.65 0.15 240), oklch(0.65 0.15 270), oklch(0.65 0.15 300), oklch(0.65 0.15 330), oklch(0.65 0.15 360))

      /* 暗色模式 - 适中的颜色 */
      :global(.dark) &
        background linear-gradient(to right, oklch(0.70 0.10 0), oklch(0.70 0.10 30), oklch(0.70 0.10 60), oklch(0.70 0.10 90), oklch(0.70 0.10 120), oklch(0.70 0.10 150), oklch(0.70 0.10 180), oklch(0.70 0.10 210), oklch(0.70 0.10 240), oklch(0.70 0.10 270), oklch(0.70 0.10 300), oklch(0.70 0.10 330), oklch(0.70 0.10 360))

    #display-setting
      input[type="range"]
        -webkit-appearance none
        height 1.5rem
        background var(--color-selection-bar)
        transition background 0.15s ease-in-out

        /* Input Thumb */
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-moz-range-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          border-width 0
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-ms-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

</style>
