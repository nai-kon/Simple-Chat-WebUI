type ModelCost = {
  input_doller: number;
  cached_input_doller: number;
  output_doller: number;
};

interface GptModel {
  [name: string]: ModelCost;
}

const million: number = 1000000;
const GptModels: GptModel = {
  "gpt-4.1": {
    input_doller: 2 / million,
    cached_input_doller: 0.5 / million,
    output_doller: 8 / million,
  },
  "gpt-4.1-mini": {
    input_doller: 0.4 / million,
    cached_input_doller: 0.1 / million,
    output_doller: 1.6 / million,
  },
  "gpt-4.1-nano": {
    input_doller: 0.1 / million,
    cached_input_doller: 0.025 / million,
    output_doller: 0.4 / million,
  },
  "gpt-4o": {
    input_doller: 2.5 / million,
    cached_input_doller: 1.25 / million,
    output_doller: 10 / million,
  },
  "gpt-4o-mini": {
    input_doller: 0.15 / million,
    cached_input_doller: 0.075 / million,
    output_doller: 0.6 / million,
  },
  "o1": {
    input_doller: 15 / million,
    cached_input_doller: 7.5 / million,
    output_doller: 60 / million,
  },
  "o3-mini": {
    input_doller: 1.1 / million,
    cached_input_doller: 0.55 / million,
    output_doller: 4.4 / million,
  },
};


export default GptModels;