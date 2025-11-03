#!/bin/bash

echo "🎵 DJConnect - Script de Registro de Usuario"
echo "=============================================="
echo ""

# Función para registrar un usuario
register_user() {
    USERNAME=$1
    EMAIL=$2
    PASSWORD=$3
    
    echo "Registrando usuario: $USERNAME ($EMAIL)"
    
    RESPONSE=$(curl -s -X POST http://localhost:3000/register \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
    
    echo "Respuesta: $RESPONSE"
    echo ""
}

# Función para hacer login
login_user() {
    USERNAME=$1
    PASSWORD=$2
    
    echo "Iniciando sesión: $USERNAME"
    
    RESPONSE=$(curl -s -X POST http://localhost:3000/login \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")
    
    echo "Respuesta: $RESPONSE"
    echo ""
    
    # Extraer token
    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    if [ ! -z "$TOKEN" ]; then
        echo "✅ Token obtenido: $TOKEN"
        echo ""
        echo "Guarda este token en localStorage del navegador:"
        echo "localStorage.setItem('dj-token', '$TOKEN');"
    fi
}

# Si se pasan argumentos, usar esos
if [ $# -eq 0 ]; then
    # Usuario de prueba por defecto
    echo "📝 Creando usuario de prueba..."
    register_user "djtest" "dj@test.com" "password123"
    sleep 1
    login_user "djtest" "password123"
else
    # Usar argumentos proporcionados
    register_user "$1" "$2" "$3"
    sleep 1
    login_user "$1" "$3"
fi

echo ""
echo "=============================================="
echo "🎉 Listo! Ahora puedes:"
echo "1. Abrir http://localhost:3000 en tu navegador"
echo "2. Ir a la página de login"
echo "3. Usar las credenciales que acabas de crear"
echo "=============================================="
