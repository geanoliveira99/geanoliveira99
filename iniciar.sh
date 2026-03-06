#!/bin/bash
echo ""
echo " Iniciando o projeto site-gean..."
echo ""

cd "$(dirname "$0")"

if ! command -v npm &> /dev/null; then
    echo " ERRO: Node.js / npm não encontrado."
    echo " Instale em: https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo " Instalando dependências..."
    npm install
    echo ""
fi

echo " Abrindo no navegador em http://localhost:5173"
sleep 2 && open "http://localhost:5173" &

npm run dev
