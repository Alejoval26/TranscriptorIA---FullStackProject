document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('uploadButton').addEventListener('click', uploadAudio);
    document.getElementById('recordButton').addEventListener('click', startRecording);
    document.getElementById('stopButton').addEventListener('click', stopRecording);
    document.getElementById('customFileButton').addEventListener('click', function() {
        document.getElementById('audioFile').click();
    });
    document.getElementById('audioFile').addEventListener('change', updateFileName);
});

function updateFileName() {
    const fileInput = document.getElementById('audioFile');
    const fileNameSpan = document.getElementById('fileName');
    if (fileInput.files.length > 0) {
        fileNameSpan.textContent = fileInput.files[0].name;
    } else {
        fileNameSpan.textContent = 'Ningún archivo seleccionado';
    }
}

function uploadAudio() {
    const fileInput = document.getElementById('audioFile');
    const transcriptionParagraph = document.getElementById('transcription');
    const sentimentParagraph = document.getElementById('sentiment');
    const loadingIndicator = document.getElementById('loading');

    if (fileInput.files.length === 0) {
        transcriptionParagraph.textContent = 'Por favor, seleccione un archivo de audio.';
        sentimentParagraph.textContent = '';
        return;
    }

    const audioFile = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", audioFile);

    loadingIndicator.style.display = 'flex';

    fetch('http://localhost:8000/transcribe/', {
        method: 'POST',
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        loadingIndicator.style.display = 'none';
        transcriptionParagraph.textContent = data.text ? 'Transcripción: ' + data.text : 'No se recibió texto del servidor.';
        if (data.sentiment && data.sentiment.length > 0) {
            const sentiment = data.sentiment[0];
            sentimentParagraph.textContent = getSentimentMessage(sentiment.label, sentiment.score);
        } else {
            sentimentParagraph.textContent = 'No se recibió resultado del análisis de sentimientos.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        loadingIndicator.style.display = 'none';
        transcriptionParagraph.textContent = 'Error al cargar el archivo.';
        sentimentParagraph.textContent = '';
    });
}

function getSentimentMessage(label, score) {
    const messages = {
        "1 star":  "El texto transcrito del audio cargado representa una emoción de enojo",
        "2 stars": "El texto transcrito del audio cargado representa una emoción neutral",
        "3 stars": "El texto transcrito del audio cargado representa una emoción neutral",
        "4 stars": "El texto transcrito del audio cargado representa una emoción de felicidad",
        "5 stars": "El texto transcrito del audio cargado representa una emoción de mucha felicidad"
    };
    return `Sentimiento: ${label} (Confianza: ${(score * 100).toFixed(2)}%) - ${messages[label] || 'No se pudo determinar la emoción'}`;
}

let mediaRecorder;
let audioChunks = [];

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            document.getElementById('recordButton').style.display = 'none';
            document.getElementById('stopButton').style.display = 'inline-block';

            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const audioFile = new File([audioBlob], "recording.mp3", { type: 'audio/mp3' });
                const formData = new FormData();
                formData.append("file", audioFile);

                const loadingIndicator = document.getElementById('loading');
                const transcriptionParagraph = document.getElementById('transcription');
                const sentimentParagraph = document.getElementById('sentiment');
                loadingIndicator.style.display = 'flex';

                fetch('http://localhost:8000/transcribe/', {
                    method: 'POST',
                    body: formData,
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    loadingIndicator.style.display = 'none';
                    transcriptionParagraph.textContent = data.text ? 'Transcripción: ' + data.text : 'No se recibió texto del servidor.';
                    if (data.sentiment && data.sentiment.length > 0) {
                        const sentiment = data.sentiment[0];
                        sentimentParagraph.textContent = getSentimentMessage(sentiment.label, sentiment.score);
                    } else {
                        sentimentParagraph.textContent = 'No se recibió resultado del análisis de sentimientos.';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    loadingIndicator.style.display = 'none';
                    transcriptionParagraph.textContent = 'Error al cargar el archivo.';
                    sentimentParagraph.textContent = '';
                });

                audioChunks = [];
            });
        });
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('recordButton').style.display = 'inline-block';
    document.getElementById('stopButton').style.display = 'none';
}
