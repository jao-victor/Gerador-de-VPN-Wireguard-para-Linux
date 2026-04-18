document.addEventListener('DOMContentLoaded', () => {
    const btnGenerateKeys = document.getElementById('btn-generate-keys');
    const privateKeyInput = document.getElementById('private_key');
    const form = document.getElementById('wg-form');
    const btnSubmit = document.getElementById('btn-submit');
    const modal = document.getElementById('success-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    
    const displayPubkeySection = document.getElementById('generated-pubkey-display');
    const displayPubkey = document.getElementById('display_pubkey');
    const btnCopyPubkey = document.getElementById('btn-copy-pubkey');
    
    const publicKeyGroup = document.getElementById('public_key_group');
    const publicKeyInput = document.getElementById('public_key');
    const btnCopyPublicKey = document.getElementById('btn-copy-public-key');
    
    let generatedPublicKey = '';

    // Gerar Chaves via API
    btnGenerateKeys.addEventListener('click', async () => {
        btnGenerateKeys.textContent = 'Gerando...';
        btnGenerateKeys.disabled = true;
        
        try {
            const response = await fetch('/api/generate_keys');
            const data = await response.json();
            
            if (data.success) {
                privateKeyInput.value = data.private_key;
                generatedPublicKey = data.public_key;
                
                // Mostrar a chave pública logo abaixo
                publicKeyInput.value = data.public_key;
                publicKeyGroup.style.display = 'block';
                
                // Animação de destaque visual para os inputs
                privateKeyInput.style.borderColor = 'var(--success)';
                publicKeyInput.style.borderColor = 'var(--success)';
                setTimeout(() => {
                    privateKeyInput.style.borderColor = 'var(--input-border)';
                    publicKeyInput.style.borderColor = 'var(--input-border)';
                }, 1000);
            } else {
                alert('Erro ao gerar chaves: ' + data.message);
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Não foi possível conectar ao servidor para gerar as chaves.');
        } finally {
            btnGenerateKeys.textContent = 'Gerar Chaves';
            btnGenerateKeys.disabled = false;
        }
    });

    // Submissão do Formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = 'Gerando Arquivo...';
        btnSubmit.disabled = true;
        
        // Coletar dados
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch('/api/generate_config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                const modalMessage = document.getElementById('success-modal-message');
                if (result.saved_locally) {
                    modalMessage.innerHTML = '<strong>Configuração concluída!</strong><br><br>' + result.message;
                } else {
                    if (result.message) {
                        alert(result.message + "\n\nBaixando o arquivo localmente como alternativa...");
                    }
                    modalMessage.innerHTML = 'O arquivo <strong>wg0.conf</strong> foi baixado com sucesso.';
                    downloadConfig(result.config, 'wg0.conf');
                }
                
                // Mostrar a chave pública caso tenha sido gerada na sessão
                if (generatedPublicKey && privateKeyInput.value.includes(data.private_key)) {
                    displayPubkey.textContent = generatedPublicKey;
                    displayPubkeySection.style.display = 'block';
                } else {
                    displayPubkeySection.style.display = 'none';
                }
                
                // Mostrar modal
                modal.classList.remove('hidden');
            } else {
                alert('Erro ao gerar a configuração.');
            }
            
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro ao comunicar com o servidor.');
        } finally {
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
        }
    });
    
    // Ativar WireGuard Independentemente
    const btnActivate = document.getElementById('btn-activate');
    if (btnActivate) {
        btnActivate.addEventListener('click', async () => {
            const originalText = btnActivate.innerHTML;
            btnActivate.innerHTML = 'Ativando...';
            btnActivate.disabled = true;
            
            try {
                const response = await fetch('/api/activate', {
                    method: 'POST'
                });
                const result = await response.json();
                
                // Reaproveitamos o modal de sucesso para exibir a mensagem
                const modalMessage = document.getElementById('success-modal-message');
                if (result.success) {
                    modalMessage.innerHTML = '<strong>Sucesso!</strong><br><br>' + result.message;
                } else {
                    modalMessage.innerHTML = '<strong>Falha na Ativação</strong><br><br>' + result.message;
                }
                displayPubkeySection.style.display = 'none'; // Esconde a chave pública nesse fluxo
                modal.classList.remove('hidden');
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro ao comunicar com o servidor.');
            } finally {
                btnActivate.innerHTML = originalText;
                btnActivate.disabled = false;
            }
        });
    }

    // Função de Download
    function downloadConfig(content, filename) {
        const element = document.createElement('a');
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    // Modal Events
    btnCloseModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Copiar Chave Pública (Modal)
    btnCopyPubkey.addEventListener('click', () => {
        navigator.clipboard.writeText(displayPubkey.textContent).then(() => {
            const oldText = btnCopyPubkey.textContent;
            btnCopyPubkey.textContent = '✓';
            setTimeout(() => {
                btnCopyPubkey.textContent = oldText;
            }, 2000);
        });
    });

    // Copiar Chave Pública (Formulário)
    if (btnCopyPublicKey) {
        btnCopyPublicKey.addEventListener('click', () => {
            if (publicKeyInput.value) {
                navigator.clipboard.writeText(publicKeyInput.value).then(() => {
                    const oldText = btnCopyPublicKey.textContent;
                    btnCopyPublicKey.textContent = 'Copiado!';
                    setTimeout(() => {
                        btnCopyPublicKey.textContent = oldText;
                    }, 2000);
                });
            }
        });
    }
});
