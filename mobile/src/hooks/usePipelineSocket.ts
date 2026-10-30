import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import Constants from 'expo-constants';

function getAutoWsUrl(): string {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) return process.env.EXPO_PUBLIC_BACKEND_URL;
  const host = Constants.manifest?.debuggerHost?.split(':')[0];
  if (host) return `ws://${host}:3000/ws`;
  // Android emulator
  return 'ws://10.0.2.2:3000/ws';
}

export function usePipelineSocket(serverUrl = getAutoWsUrl()) {
  const ws = useRef<WebSocket | null>(null);

  const setAgents = useAppStore((s) => s.setAgents);
  const setPositions = useAppStore((s) => s.setPositions);
  const addPosition = useAppStore((s) => s.addPosition);
  const updatePosition = useAppStore((s) => s.updatePosition);
  const setConfig = useAppStore((s) => s.setConfig);
  const addKillLog = useAppStore((s) => s.addKillLog);
  const pushFeed = useAppStore((s) => s.pushFeed);
  const setWallet = useAppStore((s) => s.setWallet);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    function connect() {
      try {
        ws.current = new WebSocket(serverUrl);

        ws.current.onopen = () => {
          pushFeed({ type: 'system', message: 'Connected to Nocturne Engine' });
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case 'init':
                if (data.state) {
                  setAgents(data.state.agents);
                  setPositions(data.state.positions);
                  setConfig(data.state.config);
                  setWallet({ balanceSol: data.state.demoBalanceSol });
                }
                break;
              case 'agent_status':
                setAgents(data.agents);
                break;
              case 'scouted':
                pushFeed({
                  type: 'scouted',
                  message: `New token detected: ${data.token.symbol} (${data.token.source})`,
                  tokenAddress: data.token.address,
                  symbol: data.token.symbol,
                });
                break;
              case 'killed':
                addKillLog(data.kill);
                pushFeed({
                  type: 'killed',
                  message: `Rejected ${data.kill.symbol}: ${data.kill.details}`,
                  tokenAddress: data.kill.tokenAddress,
                  symbol: data.kill.symbol,
                });
                break;
              case 'position_opened':
                addPosition(data.position);
                pushFeed({
                  type: 'trade',
                  message: `Bought ${data.position.symbol} at $${data.position.entryPriceUsd.toFixed(4)}`,
                  tokenAddress: data.position.tokenAddress,
                  symbol: data.position.symbol,
                });
                break;
              case 'position_closed':
                updatePosition(data.position.id, data.position);
                pushFeed({
                  type: 'trade',
                  message: `Closed ${data.position.symbol} (${data.position.closedReason})`,
                  tokenAddress: data.position.tokenAddress,
                  symbol: data.position.symbol,
                });
                break;
              case 'config_updated':
                setConfig(data.config);
                break;
              case 'balance_reset':
                setWallet({ balanceSol: data.balanceSol });
                pushFeed({ type: 'system', message: `Demo balance reset to ${data.balanceSol} SOL` });
                break;
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.current.onclose = () => {
          pushFeed({ type: 'system', message: 'Disconnected from engine. Reconnecting...' });
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.current.onerror = () => {
          ws.current?.close();
        };
      } catch (err) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [serverUrl]);
}
