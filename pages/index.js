import { startMic, startPayment } from './yourFunctionsFile';

const IndexPage = () => {
    return (
        <div>
            <button onClick={startMic}>Start Microphone</button>
            <button onClick={startPayment}>Start Payment</button>
        </div>
    );
};

export default IndexPage;