import { Ficha, Configuracoes } from '@/types'
import { format } from 'date-fns'
import { createPortal } from 'react-dom'

export function PrintFichas({ fichas, config }: { fichas: Ficha[]; config: Configuracoes }) {
  if (!fichas || fichas.length === 0) return null

  const content = (
    <div className="print-root hidden print:block w-full bg-white text-black text-[13px] m-0 p-0">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 15mm; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
          }
          body > #root {
            display: none !important;
          }
          .print-root {
            display: block !important;
          }
          .ficha-print-page { 
            break-after: page; 
            page-break-after: always; 
            position: relative; 
            min-height: 250mm;
            padding-bottom: 40px; 
          }
          .ficha-print-page:last-child { 
            break-after: auto; 
            page-break-after: auto; 
          }
          .print-footer { 
            position: absolute; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            font-size: 10px; 
            border-top: 1px solid #000; 
            padding-top: 4px; 
            display: flex; 
            justify-content: space-between; 
          }
        `}
      </style>

      {fichas.map((ficha, index) => (
        <div key={ficha.id || index} className="ficha-print-page">
          <div className="border border-black p-3 mb-4 text-center">
            <h1 className="text-xl font-bold uppercase mb-1">
              {config.nomeFicha || 'Ficha de Recebimento de Amostras'}
            </h1>
            <div className="flex justify-between w-full text-xs font-semibold mt-2 border-t border-black pt-2">
              <span>Formulário Padrão: {config.formularioPadrao || 'FPGQ012-B'}</span>
              <span>Revisão: {config.revisaoFicha || '01'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 border border-black p-3 text-xs">
            <div>
              <span className="font-bold">Cliente:</span> {ficha.clienteNome || '-'}
            </div>
            <div>
              <span className="font-bold">Data Recebimento:</span>{' '}
              {ficha.dataRecebimento ? format(new Date(ficha.dataRecebimento), 'dd/MM/yyyy') : '-'}
            </div>
            <div>
              <span className="font-bold">CPF/CNPJ:</span> {ficha.cpfCnpj || '-'}
            </div>
            <div>
              <span className="font-bold">Cidade/UF:</span> {ficha.cidadeUf || '-'}
            </div>
            <div>
              <span className="font-bold">Contrato:</span> {ficha.codigoContrato || '-'}
            </div>
            <div>
              <span className="font-bold">Responsável:</span> {ficha.responsavel || '-'}
            </div>
            <div>
              <span className="font-bold">Recebimento:</span> {ficha.formaRecebimento || '-'}
            </div>
          </div>

          <div className="mb-2 font-bold uppercase text-xs border-b border-black pb-1">
            Itens da Amostra
          </div>
          <div className="space-y-3">
            {ficha.itens && ficha.itens.length > 0 ? (
              ficha.itens.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="border border-black p-2 text-xs break-inside-avoid"
                >
                  <div className="font-bold border-b border-gray-300 pb-1 mb-2 bg-gray-100 p-1">
                    Amostra {idx + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <div className="col-span-2">
                      <span className="font-semibold">Descrição:</span> {item.descricao || '-'}
                    </div>
                    <div>
                      <span className="font-semibold">Tipo:</span> {item.tipo || '-'}
                    </div>
                    <div>
                      <span className="font-semibold">Quantidade:</span> {item.quantidade || '-'}{' '}
                      {item.unidade || ''}
                    </div>
                    <div>
                      <span className="font-semibold">Embalagem:</span> {item.embalagem || '-'}
                    </div>
                    <div>
                      <span className="font-semibold">Setor Destino:</span>{' '}
                      {item.setorDestino || '-'}
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold">Análise Solicitada:</span>{' '}
                      {item.analiseSolicitada || '-'}
                    </div>
                    {item.ordemServico && (
                      <div>
                        <span className="font-semibold">Ordem de Serviço (OS):</span>{' '}
                        {item.ordemServico}
                      </div>
                    )}
                    {item.protocoloWeb && (
                      <div>
                        <span className="font-semibold">Protocolo Web:</span> {item.protocoloWeb}
                      </div>
                    )}
                    {item.dosagem && (
                      <div>
                        <span className="font-semibold">Dosagem:</span> {item.dosagem}{' '}
                        {item.unidadeDosagem}
                      </div>
                    )}
                    {item.fatorDiluicao && (
                      <div>
                        <span className="font-semibold">Fator de Diluição:</span>{' '}
                        {item.fatorDiluicao}
                      </div>
                    )}
                    {item.enviou1gAtivo && (
                      <div>
                        <span className="font-semibold">Enviou 1g Ativo:</span> {item.enviou1gAtivo}
                      </div>
                    )}
                    {item.enviou1gExcipiente && (
                      <div>
                        <span className="font-semibold">Enviou 1g Excipiente:</span>{' '}
                        {item.enviou1gExcipiente}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 italic p-2 border border-black">
                Nenhuma amostra registrada.
              </div>
            )}
          </div>

          {ficha.ocorrencias && ficha.ocorrencias.length > 0 && (
            <div className="mt-4 break-inside-avoid">
              <div className="mb-2 font-bold uppercase text-xs border-b border-black pb-1">
                Ocorrências
              </div>
              <div className="space-y-2">
                {ficha.ocorrencias.map((o) => (
                  <div key={o.id} className="border border-gray-400 p-2 text-[11px] bg-gray-50">
                    <div className="font-semibold text-black mb-1">Descrição: {o.descricao}</div>
                    {o.respostaSecretaria && (
                      <div className="text-black">
                        <span className="font-semibold">Resposta:</span> {o.respostaSecretaria}
                      </div>
                    )}
                    <div className="mt-1 text-gray-600">
                      Status: {o.resolvida ? 'Resolvida' : 'Pendente'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="print-footer">
            <span>Impresso em: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
            <span>pág. 1/1</span>
          </div>
        </div>
      ))}
    </div>
  )

  return createPortal(content, document.body)
}
