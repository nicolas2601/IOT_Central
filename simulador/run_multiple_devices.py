#!/usr/bin/env python3
"""
Script para ejecutar múltiples simuladores de dispositivos IoT

Inicia varios dispositivos simulados en paralelo para probar la plataforma.

Uso:
    python run_multiple_devices.py --count 5
    python run_multiple_devices.py --count 3 --interval 10
"""
import subprocess
import argparse
import time
import signal
import sys
import uuid

processes = []


def signal_handler(sig, frame):
    """Maneja señales de terminación"""
    print("\n⚠ Deteniendo todos los simuladores...")
    for p in processes:
        try:
            p.terminate()
        except:
            pass
    print("✓ Todos los simuladores detenidos")
    sys.exit(0)


def main():
    parser = argparse.ArgumentParser(
        description='Ejecuta múltiples simuladores de dispositivos IoT'
    )
    
    parser.add_argument(
        '--count',
        type=int,
        default=3,
        help='Número de dispositivos a simular (default: 3)'
    )
    
    parser.add_argument(
        '--interval',
        type=int,
        default=5,
        help='Intervalo de telemetría en segundos (default: 5)'
    )
    
    parser.add_argument(
        '--broker',
        type=str,
        default='localhost',
        help='Host del broker MQTT (default: localhost)'
    )
    
    parser.add_argument(
        '--port',
        type=int,
        default=1883,
        help='Puerto del broker MQTT (default: 1883)'
    )
    
    args = parser.parse_args()
    
    # Configurar manejador de señales
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("=" * 70)
    print("  Iniciando Simuladores de Dispositivos IoT")
    print("=" * 70)
    print(f"  Cantidad: {args.count}")
    print(f"  Broker: {args.broker}:{args.port}")
    print(f"  Intervalo: {args.interval}s")
    print("=" * 70)
    print("")
    
    # Tipos de dispositivos
    device_types = ['sensor', 'actuator', 'gateway']
    
    # Iniciar simuladores
    for i in range(args.count):
        device_type = device_types[i % len(device_types)]
        device_id = str(uuid.uuid4())
        
        print(f"→ Iniciando dispositivo {i+1}/{args.count}: {device_type} ({device_id[:8]}...)")
        
        cmd = [
            'python3',
            'device_simulator.py',
            '--device-id', device_id,
            '--device-type', device_type,
            '--broker', args.broker,
            '--port', str(args.port),
            '--interval', str(args.interval)
        ]
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            processes.append(process)
            time.sleep(0.5)  # Pequeña pausa entre inicios
        except Exception as e:
            print(f"✗ Error iniciando dispositivo {i+1}: {e}")
    
    print("")
    print(f"✓ {len(processes)} simuladores iniciados")
    print("⚠ Presiona Ctrl+C para detener todos")
    print("")
    
    # Mantener el script corriendo
    try:
        while True:
            time.sleep(1)
            # Verificar si algún proceso terminó
            for i, p in enumerate(processes):
                if p.poll() is not None:
                    print(f"⚠ Dispositivo {i+1} terminó inesperadamente")
    except KeyboardInterrupt:
        signal_handler(None, None)


if __name__ == '__main__':
    main()
