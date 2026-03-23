
import { useState } from "react";
import ReactSlider from "react-slider";

export const DATE_START: number = (new Date("2026-01-01")).getDate();

const DateSlider = () => {
    const today = Date.now();
    const days = Math.ceil((today - DATE_START)/(86400 * 1000));
    const [minValue, setMinValue] = useState(0);
    const [maxValue, setMaxValue] = useState(0);

    return (
        <ReactSlider
            className="customSlider"
            thumbClassName="customSlider-thumb"
            trackClassName="customSlider-track"
            markClassName="customSlider-mark"
            marks={days}
            min={DATE_START}
            max={today}
            value={[minValue, maxValue]}
            pearling
            onChange={([v1, v2]: [number, number]) => {
                setMinValue(v1);
                setMaxValue(v2);
            }}
            renderMark={(props: React.HTMLProps<HTMLSpanElement>) => {
                const keyVal = Number(props.key);
                if (keyVal < minValue) {
                    props.className = "customSlider-mark customSlider-mark-before";
                } else if (keyVal === minValue) {
                    props.className = "customSlider-mark customSlider-mark-active";
                }
                return <span {...props} />;
            }}
        />
    );
};

export default DateSlider;