function encrypt() {

    let plaintext = document.getElementById("plaintext").value;
    let key = document.getElementById("encryptionKey").value;

    if (plaintext === "" || key === "") {
        alert("Please enter plaintext and key.");
        return;
    }

    let ciphertext = "";
    let keyIndex = 0;

    for (let i = 0; i < plaintext.length; i++) {

        let character = plaintext[i];

        if (character.match(/[A-Za-z]/)) {

            let plaintextValue =
                character.toUpperCase().charCodeAt(0) - 65;

            let keyCharacter =
                key[keyIndex % key.length].toUpperCase();

            let keyValue =
                keyCharacter.charCodeAt(0) - 65;

            let encryptedValue =
                (plaintextValue + keyValue) % 26;

            ciphertext +=
                String.fromCharCode(encryptedValue + 65);

            keyIndex++;

        } else {

            ciphertext += character;

        }
    }

    document.getElementById("ciphertextOutput").value = ciphertext;

    document.getElementById("explanation").innerHTML =
        "Encryption formula: <b>C = (P + K) mod 26</b><br><br>" +
        "Plaintext: " + plaintext + "<br>" +
        "Key: " + key + "<br>" +
        "Ciphertext: " + ciphertext;
}


function decrypt() {

    let ciphertext = document.getElementById("ciphertext").value;
    let key = document.getElementById("decryptionKey").value;

    if (ciphertext === "" || key === "") {
        alert("Please enter ciphertext and key.");
        return;
    }

    let plaintext = "";
    let keyIndex = 0;

    for (let i = 0; i < ciphertext.length; i++) {

        let character = ciphertext[i];

        if (character.match(/[A-Za-z]/)) {

            let ciphertextValue =
                character.toUpperCase().charCodeAt(0) - 65;

            let keyCharacter =
                key[keyIndex % key.length].toUpperCase();

            let keyValue =
                keyCharacter.charCodeAt(0) - 65;

            let decryptedValue =
                (ciphertextValue - keyValue + 26) % 26;

            plaintext +=
                String.fromCharCode(decryptedValue + 65);

            keyIndex++;

        } else {

            plaintext += character;

        }
    }

    document.getElementById("plaintextOutput").value = plaintext;

    document.getElementById("explanation").innerHTML =
        "Decryption formula: <b>P = (C - K + 26) mod 26</b><br><br>" +
        "Ciphertext: " + ciphertext + "<br>" +
        "Key: " + key + "<br>" +
        "Plaintext: " + plaintext;
}