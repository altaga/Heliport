import React, { Component } from 'react';
import { Text as TextSVG } from 'react-native-svg';
import { PieChart } from 'react-native-svg-charts';

function epsilonRound(num, zeros = 4) {
    return Math.round((num + Number.EPSILON) * Math.pow(10, zeros)) / Math.pow(10, zeros)
}

class Chart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: 0
        }
        this.center = [0, 0]
    }

    componentDidMount() {

    }

    componentWillUnmount() {

    }

    render() {
        let data = this.props.data
        let colors = this.props.dataColors
        let labels = this.props.dataLabels
        labels = labels.filter(({ }, index) => data[index] > 0)
        const pieData = data
            .map((value, index) => ({
                label: labels,
                value,
                multiplier: this.props.dataMultipliers[index],
                svg: {
                    fill: colors[index],
                    onPress: () => console.log(this.props.dataLabels[index]),
                },
                key: `pie-${index}`,
            })).filter((item) => item.value > 0)

        const Labels = ({ slices, height, width }) => {
            return slices.map((slice, index) => {
                const { pieCentroid, data } = slice;
                return (
                    <React.Fragment key={"text" + index}>
                        <TextSVG
                            x={pieCentroid[0]}
                            y={pieCentroid[1] - 10}
                            fill={'white'}
                            textAnchor={'middle'}
                            alignmentBaseline={'middle'}
                            fontSize={24}
                            stroke={'black'}
                            strokeWidth={0.2}
                        >
                            {this.props.show ? this.props.round[index] !== 0 ? epsilonRound(data.value * data.multiplier, this.props.round[index]) : epsilonRound(data.value * data.multiplier) : "***"}
                        </TextSVG>
                        <TextSVG
                            x={pieCentroid[0]}
                            y={pieCentroid[1] + 10}
                            fill={'white'}
                            textAnchor={'middle'}
                            alignmentBaseline={'middle'}
                            fontSize={16}
                            stroke={'black'}
                            strokeWidth={0.2}
                        >
                            {this.props.show ? data.label[index] : "***"}
                        </TextSVG>
                    </React.Fragment>

                )
            })
        }

        const changeColor = (label) => {

        }

        return (
            <>
                <PieChart outerRadius="100%" innerRadius="10%" style={{ height: this.props.size, width: this.props.size }} data={pieData} valueAccessor={({ item }) => item.value}>
                    <Labels />
                </PieChart>
            </>
        )
    }
}

export default Chart;