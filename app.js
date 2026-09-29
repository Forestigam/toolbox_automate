(() => {
  'use strict';
  const D = window.TOLLBOX_DATA;
  const tools = [
    {id:'survey', icon:'▤', title:'Levantamento técnico', short:'Organize dados de projeto, ambiente e equipamentos.', desc:'Formulário para visitas técnicas e coleta de requisitos de painéis e instalações.'},
    {id:'vent', icon:'◉', title:'Ventilação de quadros', short:'Estime a vazão necessária para o painel.', desc:'Dimensione a ventilação forçada a partir das cargas térmicas, dimensões e condições de instalação.'},
    {id:'short', icon:'ϟ', title:'Corrente de curto-circuito', short:'Estime a corrente presumida no ponto de falta.', desc:'Calcule a corrente com base na tensão, condutores, material e topologia do circuito.'},
    {id:'conduit', icon:'◌', title:'Eletrodutos', short:'Selecione diâmetros pela taxa de ocupação.', desc:'Informe os cabos e consulte três dimensões nominais compatíveis.'},
    {id:'tray', icon:'▱', title:'Eletrocalhas', short:'Avalie ocupação e capacidade de carga.', desc:'Consulte opções de calha, ocupação dos cabos e carga distribuída estimada.'},
    {id:'trunk', icon:'⌑', title:'Canaletas', short:'Dimensione canaletas para os cabos.', desc:'Calcule a ocupação e visualize as três primeiras dimensões compatíveis.'}
  ];
  const state = {active:null, results:{}, inputs:{}};
  const view = document.getElementById('view');
  const nav = document.getElementById('side-nav');
  const $ = (sel, root=document) => root.querySelector(sel);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (n, digits=2) => Number.isFinite(Number(n)) ? new Intl.NumberFormat('pt-BR',{maximumFractionDigits:digits}).format(Number(n)) : '—';
  // namedItem avoids collisions with collection properties such as elements.length.
  const control = (form,key) => form.elements.namedItem(key);
  const num = (form,key, fallback=0) => { const v=Number(control(form,key)?.value); return Number.isFinite(v)?v:fallback; };
  const val = (form,key) => String(control(form,key)?.value ?? '').trim();
  const optionList = (items, selected='') => items.map(v=>{const value=typeof v==='string'?v:v.value,label=typeof v==='string'?v:v.label;return `<option value="${esc(value)}" ${String(value)===String(selected)?'selected':''}>${esc(label)}</option>`;}).join('');
  const field = (label,name,opts={}) => {
    const {type='number',value='',unit='',placeholder='',min,max,step='any',required=false,full=false,hint='',options,readonly=false}=opts;
    const optionHtml=items=>items.map(o=>typeof o==='string'?`<option value="${esc(o)}" ${o===value?'selected':''}>${esc(o)}</option>`:`<option value="${esc(o.value)}" ${String(o.value)===String(value)?'selected':''}>${esc(o.label)}</option>`).join('');
    let control;
    if(options) control=`${unit?'<div class="input-unit">':''}<select name="${esc(name)}" ${required?'required':''}>${optionHtml(options)}</select>${unit?`<em>${esc(unit)}</em></div>`:''}`;
    else if(type==='textarea') control=`<textarea name="${esc(name)}" placeholder="${esc(placeholder)}" ${required?'required':''}>${esc(value)}</textarea>`;
    else if(type==='range') control=`<div class="range-control"><input name="${esc(name)}" type="range" value="${esc(value)}" min="${min}" max="${max}" step="${step}" data-range-output="${esc(name)}"><output data-range-label="${esc(name)}">${esc(value)} ${esc(unit)}</output></div>`;
    else control=`<div class="${unit?'input-unit':''}"><input name="${esc(name)}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${min!==undefined?`min="${min}"`:''} ${max!==undefined?`max="${max}"`:''} ${step?`step="${step}"`:''} ${readonly?'readonly':''} ${required?'required':''}>${unit?`<em>${esc(unit)}</em>`:''}</div>`;
    return `<div class="field ${full?'full':''}"><label>${esc(label)}${required?' *':''}</label>${control}${hint?`<div class="field-hint">${esc(hint)}</div>`:''}</div>`;
  };
  const panel = (title, sub, body) => `<section class="panel"><h2>${title}</h2>${sub?`<p class="panel-sub">${sub}</p>`:''}${body}</section>`;
  const selectField = (label,name,options,value,opts={}) => field(label,name,{options,value,...opts});
  const voltageOptions=[127,220,380,440,13800,34500,69000,138000,230000].map(v=>({value:v,label:v>=1000?`${fmt(v/1000,1)} kV`:`${v} V`}));
  const sectionOptions=D.trunking.cables.map(x=>x.gauge).filter(x=>x<=185).map(x=>({value:x,label:`${fmt(x,2)} mm²`}));
  const insulationOptions=['PVC','XLPE','EPR','HEPR'];
  const cableConstructionOptions=[{value:'single',label:'Unipolar (cabo simples)'},{value:'multi',label:'Multipolar (cabo múltiplo)'}];
  const toolById = id => tools.find(t=>t.id===id);
  const card = t => `<article class="tool-card" role="button" tabindex="0" data-open="${t.id}"><div class="card-top"><span class="tool-symbol">${t.icon}</span><span class="card-arrow">↗</span></div><h3>${t.title}</h3><p>${t.short}</p><button class="card-link" data-open="${t.id}">Abrir ferramenta <span aria-hidden="true">→</span></button></article>`;
  function home(){
    state.active=null; renderNav();
    view.innerHTML=`<section class="hero"><div class="eyebrow">Engenharia • instalações • cálculos</div><h1>Uma caixa de ferramentas para o seu próximo projeto.</h1><p>Reúna levantamentos e cálculos técnicos em um só lugar. Escolha uma ferramenta para começar.</p><span class="hero-chip"><span class="local-dot"></span> Seis módulos • cálculos feitos no seu dispositivo</span></section><div class="section-heading"><h2>Ferramentas disponíveis</h2><p>Selecione um módulo para abrir</p></div><div class="tool-grid">${tools.map(card).join('')}</div><div class="home-note"><span class="note-icon">ⓘ</span><span>Os resultados reproduzem as fórmulas e tabelas encontradas nos arquivos fornecidos. Confira as notas técnicas apresentadas em cada cálculo antes de usar os valores em um projeto.</span></div>`;
  }
  function renderNav(){nav.innerHTML=`<div class="nav-list">${tools.map(t=>`<button class="nav-item ${state.active===t.id?'active':''}" data-open="${t.id}"><span class="nav-icon">${t.icon}</span>${t.title}</button>`).join('')}</div>`;}
  function moduleFrame(id, formHtml, extra=''){
    const t=toolById(id); state.active=id; renderNav();
    view.innerHTML=`<button class="back-btn" data-home>← <span>Menu principal</span></button><div class="module-head"><span class="module-icon">${t.icon}</span><div><div class="eyebrow">Módulo de engenharia</div><h1 class="page-title">${t.title}</h1><p class="page-lead">${t.desc}</p></div></div>${extra}<div class="module-layout"><div class="module-main"><form id="tool-form" novalidate>${formHtml}</form></div><aside class="module-side">${renderResult(id)}</aside></div>`;updateRowCount();
  }
  function renderResult(id){
    const r=state.results[id];
    if(!r) return `<section class="panel result-panel"><div class="result-kicker">Resultado</div><div class="result-empty"><div><div class="empty-icon">⌁</div><p>Preencha os dados e execute a ferramenta para ver o resultado aqui.</p></div></div></section>`;
    const details=(r.details||[]).map(([a,b])=>`<li><span>${esc(a)}</span><strong>${esc(b)}</strong></li>`).join('');
    const notices=(r.notices||[]).map(n=>`<div class="alert ${n.kind||'info'}">${n.text}</div>`).join('');
    const recs=r.recommendations?`<div class="recommendation-grid">${r.recommendations.map((x,i)=>`<div class="recommendation"><span class="rank">${i+1}</span><div><strong>${esc(x.title)}</strong><span>${esc(x.sub)}</span></div></div>`).join('')}</div>`:'';
    return `<section class="panel result-panel"><div class="result-kicker">Resultado calculado</div><div class="result-big">${esc(r.headline)}</div><div class="result-unit">${esc(r.unit||'')}</div>${r.caption?`<p class="result-caption">${esc(r.caption)}</p>`:''}${details?`<ul class="result-list">${details}</ul>`:''}${recs}${notices}<div class="result-actions"><button type="button" class="btn btn-primary" data-pdf="${id}">Gerar PDF</button><button type="button" class="btn btn-secondary" data-new="${id}">Novo cálculo</button></div></section>`;
  }
  const rowTable=(headers,rows,addLabel='Adicionar linha')=>`<div class="table-wrap"><table class="entry-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><div class="table-tools"><button type="button" class="small-btn" data-add-row>＋ ${addLabel}</button><span data-row-count></span></div>`;
  function renderSurvey(){
    const groups=[
      ['Projeto e cliente',[['Obra / Projeto','project'],['Responsável','responsible'],['Cliente','client'],['Acompanhado por','accompanied'],['Localização','location','full']]],
      ['Ambiente e instalação',[['Tensão de alimentação','voltage'],['Topologia da rede','topology'],['Frequência da rede','frequency'],['Temperatura ambiente','ambient'],['Altitude ao nível do mar','altitude'],['Presença de SPDA','spda'],['Esquema de aterramento','ground']]],
      ['Condutores de alimentação',[['Distância do painel de alimentação','feedDistance'],['Método de instalação','installMethod'],['Número de circuitos','circuits'],['Resistividade do solo','soil'],['Espaço disponível na infraestrutura','infraSpace'],['Corrente de curto presumida','faultCurrent'],['Disjuntor a montante','upstreamBreaker']]],
      ['Instalação do painel',[['Local de instalação','panelLocation'],['Espaço disponível no local','panelSpace'],['Agressividade do ambiente','aggressiveness'],['Necessidade de expansão?','expansion'],['Entrada e saída de cabos','cableEntry'],['Abrigado?','sheltered']]],
      ['Características do equipamento',[['Tipo de equipamento','equipment'],['Inércia de partida','inertia'],['Regime de manobra','switching'],['Necessita rampa de partida?','softStarter'],['Necessita controle de velocidade?','speedControl'],['Distância do painel até a carga','loadDistance'],['Fabricante preferido','manufacturer']]],
      ['Transformador',[['Tensão no primário','primaryVoltage'],['Tensão no secundário','secondaryVoltage'],['Impedância','impedance'],['Corrente percentual em vazio','noLoadCurrent'],['Perdas de potência em vazio','noLoadLoss']]]
    ];
    const yesNo=[{value:'',label:'Selecione'},{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}];
    const breakers=[40,50,63,80,100,125,160,200,250,315,400,500,630,800,1000,1250,1600,2000,2500,3200,4000,5000,6300].map(a=>({value:a,label:`${a} A`}));
    const groundOptions=['TN-S','TN-C','TN-C-S','TT','IT','Outro'];
    const installOptions=['Eletrocalha','Eletroduto embutido','Eletroduto aparente','Leito para cabos','Bandeja','Canaleta','Perfilado','Enterrado diretamente','Aéreo','Outro'];
    const fields=groups.map(([title,items])=>panel(title,'',`<div class="field-grid">${items.map(([label,name,span])=>{
      const full=span==='full';
      if(name==='voltage'||name==='primaryVoltage'||name==='secondaryVoltage')return field(label,name,{options:[{value:'',label:'Selecione a tensão'},...voltageOptions],value:'',full});
      if(name==='topology')return selectField(label,name,['Selecione','3F+N+PE','3F+N','3F+PE','3F','2F+N+PE','2F+N','2F','1F+N+PE','1F+N','1F+PE'],'Selecione');
      if(name==='frequency')return selectField(label,name,['Selecione','50 Hz','60 Hz'],'Selecione');
      if(name==='ambient')return field(label,name,{type:'range',value:30,min:-10,max:100,step:1,unit:'°C',hint:'Ajuste entre −10 e 100 °C.'});
      if(name==='altitude')return field(label,name,{value:'',min:0,step:1,unit:'m',placeholder:'Ex.: 550'});
      if(name==='spda')return selectField(label,name,[{value:'',label:'Selecione'},{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}],'');
      if(name==='ground')return selectField(label,name,['Selecione',...groundOptions],'Selecione');
      if(name==='feedDistance'||name==='circuits'||name==='loadDistance')return field(label,name,{value:'',min:0,step:name==='circuits'?1:.01,unit:name==='circuits'?'circuitos':'m',placeholder:'Informar valor'});
      if(name==='installMethod')return selectField(label,name,['Selecione',...installOptions],'Selecione');
      if(name==='soil')return field(label,name,{value:'',min:0,step:.01,unit:'Ω·m',placeholder:'Informar valor'});
      if(name==='infraSpace')return selectField(label,name,['Selecione','Pouco','Médio','Muito'],'Selecione');
      if(name==='faultCurrent')return field(label,name,{value:'',min:0,step:.01,unit:'kA',placeholder:'Informar ou importar'});
      if(name==='upstreamBreaker')return selectField(label,name,breakers,40,{unit:'A'});
      if(['expansion','softStarter','speedControl','sheltered'].includes(name))return selectField(label,name,yesNo,'');
      if(name==='inertia')return selectField(label,name,['Selecione','Baixa','Média','Alta'],'Selecione');
      if(name==='impedance'||name==='noLoadCurrent')return field(label,name,{value:'',min:0,step:.01,unit:'%',placeholder:'Informar valor'});
      if(name==='noLoadLoss')return field(label,name,{value:'',min:0,step:.01,unit:'W',placeholder:'Informar valor'});
      const examples={location:'Campo Grande MS / Vila Ieda - BR',panelLocation:'Base do Britador',panelSpace:'Laterais livres; traseira obstruída',aggressiveness:'Muita poeira; risco de impacto',cableEntry:'Entrada e saída por cima',equipment:'Britador de resíduos',switching:'Acionamento < 1x por hora',manufacturer:'Digite uma preferência'};
      return field(label,name,{type:'text',placeholder:examples[name]||'Preencher informação',full});
    }).join('')}</div>${title==='Condutores de alimentação'?`<div class="field-hint">Use o botão para trazer o último resultado calculado na ferramenta de corrente de curto-circuito.</div><button type="button" class="small-btn import-short" data-import-short="faultCurrent">↙ Importar última corrente calculada</button><div class="field-grid">${field('Observação sobre o espaço disponível','infraSpaceObs',{type:'textarea',full:true,placeholder:'Descreva a infraestrutura existente'})}${field('Observação sobre SPDA','spdaObs',{type:'textarea',full:true,placeholder:'Complemento ou referência do SPDA'})}</div>`:''}`)).join('');
    const reminders=['Tirar foto das placas dos motores','Tirar foto da infraestrutura elétrica','Tirar foto do local de instalação do painel','Tirar foto da placa do transformador','Tirar foto do painel de alimentação','Medir o espaço disponível para o painel','Tirar foto do equipamento','Medir a temperatura ambiente','Confirmar necessidade de expansão','Registrar fabricante preferido'];
    const reminder=panel('Lembretes da visita','Marque os itens conferidos. Os itens marcados aparecem no relatório.',`<div class="check-grid">${reminders.map((x,i)=>`<label class="check-item"><input type="checkbox" name="reminder${i}"> ${x}</label>`).join('')}</div>`);
    const obs=panel('Observações','',`<div class="field-grid">${field('Observações','observations',{type:'textarea',full:true,placeholder:'Anotações adicionais da visita'})}</div>`);
    const action=`<div class="form-actions"><button class="btn btn-primary" type="submit">Concluir levantamento</button><button class="btn btn-secondary" type="button" data-new="survey">Limpar formulário</button></div>`;
    moduleFrame('survey',`${fields}${reminder}${obs}${action}`,`<div class="alert info">Este módulo organiza os campos do modelo original. A planilha não contém uma fórmula de cálculo; o resultado é um resumo do levantamento preenchido.</div>`);
  }
  const installTypes=['Todos os Lados Expostos','Traseira Obstruída','Um dos Lados Obstruídos','Traseira e um dos lados Obstruídos','Dois lados Obstruídos','Traseira e dois lados Obstruídos','Traseira, lados e teto Obstruídos'];
  function componentRows(){return [
    {q:7,desc:'Disjuntor Motor',w:4.5},{q:7,desc:'Contator',w:2},{q:3,desc:'Barramento',w:3.62},{q:1,desc:'Fonte',w:1.47},{q:'',desc:'',w:''},{q:'',desc:'',w:''}
  ].map((r,i)=>componentRow(r,i)).join('');}
  function componentRow(r,i){return `<tr data-row><td><input name="q" type="number" min="0" step="1" value="${r.q}" placeholder="0" aria-label="Quantidade"></td><td><input name="desc" type="text" value="${esc(r.desc)}" placeholder="Descrição do componente" aria-label="Descrição"></td><td><input name="w" type="number" min="0" step=".01" value="${r.w}" placeholder="0,00" aria-label="Potência dissipada por unidade"></td><td><output data-watt-total>0,00 W</output></td><td><button class="remove-row" type="button" data-remove-row aria-label="Remover linha">×</button></td></tr>`;}
  function renderVent(){
    const tbody=componentRows();
    const components=panel('Carga térmica dos componentes','Informe quantidade e potência dissipada por unidade. O total por linha é atualizado automaticamente.',rowTable(['Qtd.','Descrição do componente','Potência dissipada [W]','Potência total [W]',''],tbody,'Adicionar componente'));
    const material=['Alumínio','Aço','Inox','ABS','Fibra de Vidro','PVC'];
    const install=`<div class="field-grid">${selectField('Material do painel','material',material,'Fibra de Vidro')}${field('Altura do painel','height',{value:.8,unit:'m',min:0,required:true})}${field('Largura do painel','width',{value:.6,unit:'m',min:0,required:true})}${field('Profundidade do painel','depth',{value:.2,unit:'m',min:0,required:true})}${selectField('Tipo de instalação','install',installTypes,'Traseira Obstruída')}${field('Temperatura interna desejada','insideTemp',{value:35,unit:'°C',required:true})}${field('Temperatura externa','outsideTemp',{value:30,unit:'°C',required:true})}${field('Altitude','altitudeVent',{value:1000,unit:'m',options:[0,500,1000,1500,2000,2500,3000].map(x=>({value:x,label:`${x} m`}))})}</div>`;
    const extra=panel('Dados do painel e do ambiente','Valores iniciais conforme o exemplo da planilha. A densidade do ar só está definida para as altitudes listadas.',install);
    const busThicknessOptions=[['3.175','3,175 mm (1/8 in)'],['4.7625','4,7625 mm (3/16 in)'],['6.35','6,35 mm (1/4 in)'],['7.9375','7,9375 mm (5/16 in)'],['9.525','9,525 mm (3/8 in)'],['12.7','12,7 mm (1/2 in)'],['custom','Outro valor']].map(([value,label])=>({value,label}));
    const busWidthOptions=[12.7,19.05,25.4,31.75,38.1,50.8,63.5,76.2,101.6,127,152.4,203.2].map(x=>({value:x,label:`${fmt(x,2)} mm (${fmt(x/25.4,2)} in)`})).concat([{value:'custom',label:'Outro valor'}]);
    const busbar=panel('Auxiliar: dissipação do barramento','A planilha traz este cálculo em uma aba separada; confira corrente admissível e condições térmicas do barramento. O resultado não entra automaticamente na carga térmica principal.',`<div class="field-grid">${field('Corrente de projeto','busCurrent',{value:110,unit:'A',min:0,step:.01,required:true})}${selectField('Resistividade do cobre','busRho',[{value:.0172,label:'0,0172 Ω·mm²/m — 20 °C'},{value:.0213,label:'0,0213 Ω·mm²/m — 70 °C'},{value:'custom',label:'Personalizada'}],.0172)}<div class="field full custom-bus-field" data-bus-custom="rho" hidden>${field('Resistividade personalizada','busRhoCustom',{value:.0172,unit:'Ω·mm²/m',min:0,step:.0001,required:true})}</div>${selectField('Espessura do barramento','busThickness',busThicknessOptions,12.7,{unit:'mm'})}<div class="field custom-bus-field" data-bus-custom="thickness" hidden>${field('Espessura personalizada','busThicknessCustom',{value:'',unit:'mm',min:0,step:.01})}</div>${selectField('Largura do barramento','busWidth',busWidthOptions,12.7,{unit:'mm'})}<div class="field custom-bus-field" data-bus-custom="width" hidden>${field('Largura personalizada','busWidthCustom',{value:'',unit:'mm',min:0,step:.01})}</div>${field('Comprimento do barramento','busLength',{value:.7,unit:'m',min:0,step:.01,required:true})}<div class="field full"><div class="field-hint">A resistividade do cobre depende da temperatura: 0,0172 Ω·mm²/m é referência a 20 °C; use o valor apropriado para o projeto. As espessuras listadas incluem 1/8, 3/16, 1/4, 5/16 e 3/8 in.</div><button type="button" class="btn btn-secondary" data-busbar>Calcular dissipação do barramento</button> <span id="busbar-output" class="muted"></span></div></div>`);
    const actions=`<div class="form-actions"><button class="btn btn-primary" type="submit">Calcular vazão</button><button class="btn btn-secondary" type="button" data-new="vent">Novo cálculo</button></div>`;
    moduleFrame('vent',`${components}${extra}${busbar}${actions}`);
    updateRowCount(); updateComponentTotals();
  }
  function renderShort(){
    const fields=`<div class="field-grid">${field('Tensão entre fase-neutro ou fase-terra (Uo)','u',{options:voltageOptions,value:127,required:true})}${field('Corrente de curto presumida inicial (Iko)','ik0',{value:7.65,unit:'kA',min:0,step:.01,required:true})}${selectField('Material do condutor','material',['Cobre','Alumínio'],'Cobre')}${field('Comprimento do circuito até o ponto de falta (l)','length',{value:43.8,unit:'m',min:0,step:.01,required:true})}${field('Seção do condutor (S)','section',{options:sectionOptions,value:2.5,unit:'mm²',required:true})}${field('Condutores por fase em paralelo','parallel',{value:1,min:1,step:1,required:true})}${selectField('Topologia do sistema','topology',['Monofásico','Bifásico','Trifásico'],'Trifásico')}</div><button type="button" class="small-btn import-short" data-import-short="ik0">↙ Importar última corrente calculada</button>`;
    const hint=`<div class="alert info">A resistividade e o fator de potência são derivados conforme as faixas da planilha. Para continuar um trecho de circuito, use “Importar última corrente calculada”; o valor importado é o Ik obtido no cálculo anterior.</div>`;
    moduleFrame('short',`${panel('Dados do circuito','Preencha os valores até o ponto em que deseja estimar o curto-circuito.',fields)}${hint}<div class="form-actions"><button class="btn btn-primary" type="submit">Calcular corrente</button><button class="btn btn-secondary" type="button" data-new="short">Novo cálculo</button></div>`);
  }
  function referenceCableDiameter(gauge){return Number(D.trunking.cables.find(x=>Number(x.gauge)===Number(gauge))?.outer)||'';}
  function cableEntryRow(kind='conduit'){
    const weight=kind==='tray'?`<td><input name="weight" type="number" min="0" step=".01" inputmode="decimal" placeholder="0,00" aria-label="Peso linear em kg por metro"></td>`:'';
    return `<tr data-row data-kind="${kind}"><td><select name="gauge" aria-label="Bitola">${optionList([{value:'',label:'Selecione'},...sectionOptions])}</select></td><td><select name="insulation" aria-label="Tipo de isolação">${optionList([{value:'',label:'Selecione'},...insulationOptions])}</select></td><td><input name="qty" type="number" min="0" step="1" inputmode="numeric" placeholder="0" aria-label="Quantidade"></td><td><select name="cableType" class="cable-type-select" aria-label="Construção do cabo">${optionList(cableConstructionOptions,'single')}</select></td><td class="diameter-cell"><input name="diam" type="number" min="0" step=".01" inputmode="decimal" placeholder="mm" readonly aria-label="Diâmetro externo em milímetros"><small class="diameter-hint">Referência unipolar</small></td>${weight}<td><button class="remove-row" type="button" data-remove-row aria-label="Remover linha">×</button></td></tr>`;
  }
  function updateCableRow(row){
    const type=row.querySelector('[name="cableType"]')?.value||'single';
    const gauge=row.querySelector('[name="gauge"]')?.value||'';
    const diameter=row.querySelector('[name="diam"]');
    const hint=row.querySelector('.diameter-hint');
    const multi=type==='multi';
    if(diameter){if(row.dataset.previousType==='multi'&&multi===false&&diameter.value)diameter.dataset.manual=diameter.value;diameter.readOnly=!multi;diameter.required=multi;diameter.value=multi?(diameter.dataset.manual||''):referenceCableDiameter(gauge);row.dataset.previousType=type;}
    if(hint)hint.textContent=multi?'Informe o diâmetro total do cabo multipolar.':'Diâmetro indicativo da tabela original; confirme no catálogo.';
    row.classList.toggle('is-multipolar',multi);
  }
  function cableRows(kind){return Array.from({length:5},()=>cableEntryRow(kind)).join('');}
  function renderConduit(){
    const rows=rowTable(['Bitola [mm²]','Tipo de isolação','Qtd.','Construção','Diâmetro externo [mm]',''],cableRows('conduit'),'Adicionar cabo');
    const controls=`<div class="field-grid">${field('Taxa de ocupação','occupancy',{value:40,step:.1,min:.1,max:100,required:true,unit:'%',hint:'A planilha inicia em 40%. O comentário também menciona 53% para um condutor e 31% para dois; a taxa não é ajustada automaticamente.'})}${selectField('Tipo de eletroduto','type',Object.keys(D.conduits),'Eletroduto Leve')}</div>`;
    moduleFrame('conduit',`${panel('Cabos no eletroduto','Informe bitola, isolação e quantidade. Para cabos multipolares, informe o diâmetro externo do catálogo. Até nove linhas.',rows)}${panel('Critério de dimensionamento','A área dos cabos é calculada como soma das áreas circulares e dividida pela ocupação escolhida.',controls)}<div class="form-actions"><button class="btn btn-primary" type="submit">Dimensionar eletroduto</button><button class="btn btn-secondary" type="button" data-new="conduit">Novo cálculo</button></div>`,`<div class="alert warn">Os diâmetros indicativos para cabos unipolares vêm da tabela original de canaletas. Isolação e construção alteram o diâmetro real; confirme sempre o catálogo do fabricante. Para multipolares, preencha o diâmetro externo total.</div>`);getRows().forEach(updateCableRow);
  }
  function renderTray(){
    const rows=rowTable(['Bitola [mm²]','Tipo de isolação','Qtd.','Construção','Diâmetro externo [mm]','Peso linear [kg/m]',''],cableRows('tray'),'Adicionar cabo');
    const ctrl=`<div class="field-grid">${field('Taxa de ocupação','occupancy',{value:40,min:.1,max:100,step:.1,required:true,unit:'%',hint:'A planilha inicia em 40%; o comentário sugere 53%, 31% ou 40% conforme quantidade de condutores, sem seleção automática.'})}${selectField('Espessura da chapa','gauge',Object.keys(D.tray.thickness),'#18')}${selectField('Material','material',Object.keys(D.tray.materials),'Inox')}${selectField('Virola','virola',['Sem','Com'],'Sem')}${field('Margem de segurança do CUD','margin',{value:1.25,min:0,step:'any',required:true})}</div>`;
    moduleFrame('tray',`${panel('Cabos na eletrocalha','Informe bitola, isolação, quantidade, construção e peso linear do cabo.',rows)}${panel('Critérios da eletrocalha','A seleção de dimensões usa a área útil por espessura da chapa. O CUD é calculado em separado.',ctrl)}<div class="form-actions"><button class="btn btn-primary" type="submit">Dimensionar eletrocalha</button><button class="btn btn-secondary" type="button" data-new="tray">Novo cálculo</button></div>`,`<div class="alert info">Peso linear não é único por bitola: varia com produto, número de veias, material e isolação. Catálogos de fabricante publicam valores por construção específica. Informe kg/m com duas casas; se o catálogo trouxer kg/km, divida por 1000. Diâmetros unipolares são apenas indicativos da planilha original; confira o catálogo.</div>`);getRows().forEach(updateCableRow);
  }
  function renderTrunk(){
    const rows=rowTable(['Bitola do cabo [mm²]','Quantidade',''],[{},{},{},{},{}].map(()=>`<tr data-row><td><select name="gauge" aria-label="Bitola">${optionList([{value:'',label:'Selecione'},...sectionOptions])}</select></td><td><input name="qty" type="number" min="0" step="1" inputmode="numeric" placeholder="0" aria-label="Quantidade"></td><td><button class="remove-row" type="button" data-remove-row aria-label="Remover linha">×</button></td></tr>`).join(''),'Adicionar cabo');
    const ctrl=`<div class="field-grid">${field('Taxa de ocupação','occupancy',{value:40,min:.1,max:100,step:.1,required:true,unit:'%'})}</div><div class="field-hint">A área útil da canaleta é 90% da área geométrica na base original. A planilha não apresenta um campo de ajuste para esse fator.</div>`;
    moduleFrame('trunk',`${panel('Cabos na canaleta','Selecione a bitola cadastrada e indique a quantidade.',rows)}${panel('Critério de dimensionamento','A fórmula usa a bitola ao quadrado como área ocupada, e não a área circular da tabela.',ctrl)}<div class="form-actions"><button class="btn btn-primary" type="submit">Dimensionar canaleta</button><button class="btn btn-secondary" type="button" data-new="trunk">Novo cálculo</button></div>`,`<div class="alert warn">A fórmula original usa o quadrado do diâmetro externo para a ocupação. Essa regra foi mantida; a tabela também contém uma área circular que não é usada pela fórmula principal.</div>`);
  }
  function openModule(id){state.results[id]=null;({survey:renderSurvey,vent:renderVent,short:renderShort,conduit:renderConduit,tray:renderTray,trunk:renderTrunk}[id]||home)();}
  function getRows(){return [...document.querySelectorAll('[data-row]')];}
  function updateRowCount(){const c=$('[data-row-count]');if(!c)return;const id=state.active,limit=id==='vent'?74:9;c.textContent=`${getRows().length} de ${limit} linhas`;}
  function updateComponentTotals(){getRows().forEach(r=>{const q=Number(rowValue(r,'q')||0),w=Number(rowValue(r,'w')||0),out=r.querySelector('[data-watt-total]');if(out)out.textContent=`${fmt(q*w,2)} W`;});}
  function rowValue(row,name){return String(row.querySelector(`[name="${name}"]`)?.value||'').trim();}
  function formInputs(){
    const f=$('#tool-form'); if(!f)return {};
    const obj={}; for(const [k,v] of new FormData(f)) {if(obj[k]!==undefined){obj[k]=Array.isArray(obj[k])?obj[k].concat(v):[obj[k],v]}else obj[k]=v;}
    obj.rows=getRows().map(r=>Object.fromEntries([...r.querySelectorAll('input,select')].map(x=>[x.name,x.value])));
    return obj;
  }
  function fail(msg){toast(msg);return false;}
  function calculateSurvey(f){
    const inputs={}; [...f.elements].forEach(e=>{if(e.name)inputs[e.name]=e.type==='checkbox'?e.checked:e.value;});
    const labels=[...f.querySelectorAll('input:not([type=checkbox]), textarea,select')].map(e=>[e.closest('.field')?.querySelector('label')?.textContent||e.name,e.value.trim()]).filter(([a,b])=>b);
    const checked=[...f.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.parentElement.textContent.trim());
    state.inputs.survey={labels,checked,observations:val(f,'observations')};
    state.results.survey={headline:`${labels.length} campos`,unit:'preenchidos no levantamento',caption:'Revise os dados e gere um relatório em PDF.',details:[['Lembretes conferidos',String(checked.length)],['Campos preenchidos',String(labels.length)]],notices:[]};
    refreshResult('survey'); toast('Levantamento preparado. Confira os dados e gere o PDF.');
  }
  function calculateVent(f){
    const rows=getRows().map(r=>({qty:Number(rowValue(r,'q')||0),description:rowValue(r,'desc'),watts:Number(rowValue(r,'w')||0)})).filter(r=>r.description||r.qty||r.watts);
    if(!rows.length)return fail('Informe ao menos um componente com quantidade e potência dissipada.');
    if(rows.some(r=>!Number.isFinite(r.qty)||!Number.isFinite(r.watts)||r.qty<0||r.watts<0))return fail('Revise quantidades e potências dos componentes.');
    const h=num(f,'height'),w=num(f,'width'),p=num(f,'depth'),ti=num(f,'insideTemp'),ta=num(f,'outsideTemp'),alt=Number(val(f,'altitudeVent'));
    if(h<=0||w<=0||p<=0)return fail('As três dimensões do painel devem ser maiores que zero.');
    const u=({'Aço':5.5,'Alumínio':12,'Inox':6.5})[val(f,'material')]??3.5;
    const install=val(f,'install');
    const area={
      'Todos os Lados Expostos':1.8*h*(w+p)+1.4*w*p,
      'Traseira Obstruída':1.4*w*(h+p)+1.8*p*h,
      'Um dos Lados Obstruídos':1.4*p*(h+w)+1.8*w*h,
      'Traseira e um dos lados Obstruídos':1.4*h*(w+p)+1.4*w*p,
      'Dois lados Obstruídos':1.8*w*h+1.4*w*p+p*h,
      'Traseira e dois lados Obstruídos':1.4*w*(h+p)+p*h,
      'Traseira, lados e teto Obstruídos':1.4*w*h+.7*w*p+p*h
    }[install];
    const rho={0:1.225,500:1.167,1000:1.112,1500:1.058,2000:1.006,2500:.957,3000:.909}[alt];
    if(!rho)return fail('Selecione uma altitude disponível na tabela de densidade do ar.');
    const dt=ti-ta;if(dt<=0)return fail('A temperatura interna desejada deve ser maior que a temperatura externa.');
    const q=rows.reduce((s,r)=>s+r.qty*r.watts,0),qs=u*area*dt,qe=q-qs,v=3.582*qe/(rho*dt);
    const notices=[];if(qe<=0)notices.push({kind:'warn',text:'A carga térmica calculada é menor ou igual à perda de calor pela superfície; a fórmula original resulta em vazão nula ou negativa.'});
    const result={headline:fmt(v,2),unit:'m³/h de vazão necessária',caption:`Equivalente a ${fmt(v/1.699,2)} cfm.`,details:[['Carga térmica (Qv)',`${fmt(q,2)} W`],['Perda de calor (Qs)',`${fmt(qs,2)} W`],['Capacidade de resfriamento (Qe)',`${fmt(qe,2)} W`],['Área efetiva',`${fmt(area,3)} m²`],['Diferença de temperatura',`${fmt(dt,2)} °C`],['Densidade do ar',`${fmt(rho,3)} kg/m³`],['Push',`${fmt(v*1.3,2)} m³/h • ${fmt(v*1.3/1.699,2)} cfm`],['Push - Pull',`${fmt(v*1.04,2)} m³/h • ${fmt(v*1.04/1.699,2)} cfm`]],notices};
    state.inputs.vent={rows,material:val(f,'material'),height:h,width:w,depth:p,install,insideTemp:ti,outsideTemp:ta,altitude:alt}; state.results.vent=result; refreshResult('vent');
  }
  function calculateShort(f){
    const U=num(f,'u'),ik0=num(f,'ik0'),l=num(f,'length'),S=num(f,'section'),parallel=num(f,'parallel'),material=val(f,'material'),topology=val(f,'topology');
    if(U<=0||ik0<1.5||l<=0||S<=0||parallel<1||!Number.isInteger(parallel))return fail('Use valores positivos; a corrente inicial deve ser de pelo menos 1,5 kA e a quantidade em paralelo deve ser um inteiro positivo.');
    const cos=ik0>20?.25:ik0>=10.1?.3:ik0>=6.1?.5:ik0>=4.6?.7:ik0>=3.1?.8:.9;
    const rho=material==='Cobre'?22.4:36, len=(topology==='Monofásico'||topology==='Bifásico')?2*l:l;
    const den=Math.sqrt((U/ik0)**2+(2*U*rho*cos*len)/(ik0*S*parallel)+(rho*len/(S*parallel))**2);
    const ik=U/den;
    state.inputs.short={u:U,ik0,ik,material,length:l,section:S,parallel,topology,cos,rho};
    state.results.short={headline:fmt(ik,4),unit:'kA de corrente presumida (Ik)',caption:'Estimativa conforme a fórmula da planilha original.',details:[['Tensão de fase (Uo)',`${fmt(U,2)} V`],['Corrente inicial (Iko)',`${fmt(ik0,2)} kA`],['Comprimento considerado',`${fmt(len,2)} m`],['Resistividade (ρ)',`${fmt(rho,1)} mΩ·mm²/m`],['Fator de potência (cos φk0)',fmt(cos,2)],['Seção × paralelos',`${fmt(S,2)} mm² × ${parallel}`]],notices:[]};refreshResult('short');
  }
  function normalizeRows(kind){
    return getRows().map(r=>Object.fromEntries([...r.querySelectorAll('input,select')].map(x=>[x.name,x.value.trim()]))).filter(r=>state.active==='vent'?(r.q||r.desc||r.w):(state.active==='trunk'?(r.gauge||r.qty):(r.gauge||r.insulation||r.qty||r.diam||r.weight)));
  }
  function recommendByArea(items,areaFn,target,limit=3){return items.map((item,index)=>({item,index,area:areaFn(item)})).filter(x=>x.area>=target).slice(0,limit);}
  function calculateConduit(f){
    const rows=normalizeRows('conduit');if(!rows.length)return fail('Informe ao menos um cabo.');
    let total=0;for(const r of rows){const q=Number(r.qty),d=Number(r.diam);if(!r.gauge||!r.insulation||!r.cableType||!Number.isFinite(q)||!Number.isFinite(d)||q<=0||d<=0)return fail('Cada cabo preenchido precisa de bitola, isolação, construção, quantidade e diâmetro externo válidos.');total+=q*Math.PI*d*d/4;}
    const occ=num(f,'occupancy')/100,type=val(f,'type');if(occ<=0||occ>1)return fail('A taxa de ocupação deve ser maior que zero e até 100%.');
    const need=total/occ, list=D.conduits[type]||[], choices=list.filter(x=>Number(x.area)>=need).slice(0,3);
    const notices=[];if(!choices.length)notices.push({kind:'warn',text:`A área mínima calculada (${fmt(need,2)} mm²) excede a maior área útil cadastrada para ${type}.`});
    const recs=choices.map(x=>({title:`${x.nominal} (${x.mm} mm)`,sub:`Área útil ${fmt(x.area,2)} mm² • ocupação resultante ${fmt(total/x.area*100,1)}%`}));
    const headline=choices.length?`${choices[0].nominal} (${choices[0].mm} mm)`:'Sem tamanho compatível';
    const result={headline,unit:choices.length?'primeira dimensão compatível':`necessária ${fmt(need,2)} mm²`,caption:`Área total dos cabos: ${fmt(total,2)} mm² • taxa-alvo ${fmt(occ*100,1)}%.`,details:[['Área mínima necessária',`${fmt(need,2)} mm²`],['Tipo',type],['Linhas de cabo',String(rows.length)]],recommendations:recs,notices};
    state.inputs.conduit={rows,occupancy:occ,type,total,need};state.results.conduit=result;refreshResult('conduit');
  }
  function calculateTray(f){
    const rows=normalizeRows('tray');if(!rows.length)return fail('Informe ao menos um cabo.');let usedArea=0,totalWeight=0;
    for(const r of rows){const q=Number(r.qty),d=Number(r.diam),w=Number(r.weight);if(!r.gauge||!r.insulation||!r.cableType||!Number.isFinite(q)||!Number.isFinite(d)||!Number.isFinite(w)||q<=0||d<=0||w<=0)return fail('Cada cabo preenchido precisa de bitola, isolação, construção, quantidade, diâmetro e peso linear positivos.');usedArea+=q*d*d;totalWeight+=q*w;}
    const occ=num(f,'occupancy')/100,gauge=val(f,'gauge'),material=val(f,'material'),virola=val(f,'virola'),margin=num(f,'margin');if(occ<=0||occ>1||margin<=0)return fail('Taxa de ocupação e margem devem ser maiores que zero; a taxa não pode exceder 100%.');
    const needed=usedArea/occ, items=D.tray.sizes.map((size,index)=>({size,index,area:size.areas[gauge]})).filter(x=>Number(x.area)>=needed).slice(0,3);
    const thickness=D.tray.thickness[gauge],density=D.tray.materials[material];
    const recs=items.map(({size,area})=>{const linear=(size.width/1000+2*size.height/1000+(virola==='Com'?.02:0))*(thickness/1000)*density;const cud=(totalWeight+linear)*margin;return {title:`${size.width} × ${size.height} mm`,sub:`Área útil ${fmt(area,2)} mm² • ocupação ${fmt(usedArea/area*100,1)}% • CUD ${fmt(cud,2)} kg/m`};});
    const notices=[];if(!items.length)notices.push({kind:'warn',text:`Nenhuma configuração da base atende à área mínima de ${fmt(needed,2)} mm² para chapa ${gauge}.`});
    const result={headline:items.length?`${items[0].size.width} × ${items[0].size.height} mm`:'Sem tamanho compatível',unit:items.length?'primeira dimensão compatível':`área mínima ${fmt(needed,2)} mm²`,caption:`Área ocupada: ${fmt(usedArea,2)} mm² • peso total dos cabos: ${fmt(totalWeight,3)} kg/m.`,details:[['Área mínima de calha',`${fmt(needed,2)} mm²`],['Chapa / material',`${gauge} • ${material}`],['Virola',virola],['Margem CUD',fmt(margin,2)],['Recomendações',String(items.length)]],recommendations:recs,notices};
    state.inputs.tray={rows,occupancy:occ,gauge,material,virola,margin,usedArea,totalWeight,needed};state.results.tray=result;refreshResult('tray');
  }
  function calculateTrunk(f){
    const rows=normalizeRows('trunk');if(!rows.length)return fail('Informe ao menos um cabo.');let total=0;
    for(const r of rows){const q=Number(r.qty),gauge=Number(r.gauge);const db=D.trunking.cables.find(x=>Number(x.gauge)===gauge);if(!Number.isFinite(q)||q<=0||!db)return fail('Selecione uma bitola cadastrada e uma quantidade positiva para cada linha.');total+=db.usedArea*q;}
    const occ=num(f,'occupancy')/100;if(occ<=0||occ>1)return fail('A taxa de ocupação deve ser maior que zero e até 100%.');const need=total/(occ*D.trunking.useFactor);
    const items=D.trunking.sizes.filter(x=>x.usefulArea>=need).slice(0,3);const recs=items.map(x=>({title:`${x.width} × ${x.height} mm`,sub:`Área útil ${fmt(x.usefulArea,2)} mm² • ocupação ${fmt(total/x.usefulArea*100,1)}%`}));
    const notices=[];if(!items.length)notices.push({kind:'warn',text:`Nenhuma canaleta na tabela original atende à área mínima necessária de ${fmt(need,2)} mm².`});
    const result={headline:items.length?`${items[0].width} × ${items[0].height} mm`:'Sem tamanho compatível',unit:items.length?'primeira dimensão compatível':`área mínima ${fmt(need,2)} mm²`,caption:`Área ocupada calculada: ${fmt(total,2)} mm² • fator útil da canaleta: ${fmt(D.trunking.useFactor*100,0)}%.`,details:[['Área total ocupada',`${fmt(total,2)} mm²`],['Área mínima necessária',`${fmt(need,2)} mm²`],['Taxa de ocupação selecionada',`${fmt(occ*100,1)}%`],['Linhas de cabo',String(rows.length)]],recommendations:recs,notices};
    state.inputs.trunk={rows,occupancy:occ,total,need};state.results.trunk=result;refreshResult('trunk');
  }
  function calcBusbar(f){const selected=(key,custom)=>val(f,key)==='custom'?num(f,custom):num(f,key);const I=num(f,'busCurrent'),rho=selected('busRho','busRhoCustom'),th=selected('busThickness','busThicknessCustom'),width=selected('busWidth','busWidthCustom'),length=num(f,'busLength');if(I<=0||rho<=0||th<=0||width<=0||length<=0)return fail('Preencha os dados positivos do barramento.');const p=Number((rho*length*I*I/(th*width)).toFixed(2));const out=$('#busbar-output');if(out)out.textContent=`${fmt(p,2)} W (não incluído automaticamente na carga térmica)`;state.inputs.busbar={I,rho,th,width,length,p};}
  function pdf(id){
    const result=state.results[id],t=toolById(id);if(!result)return toast('Calcule ou conclua o formulário antes de gerar o PDF.');
    let sections='';
    if(id==='survey'){
      const d=state.inputs.survey||{};sections=`<h2>Dados informados</h2><table>${(d.labels||[]).map(([a,b])=>`<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</table><h2>Lembretes conferidos</h2><p>${esc((d.checked||[]).join(' • ')||'Nenhum lembrete marcado.')}</p>${d.observations?`<h2>Observações</h2><p>${esc(d.observations)}</p>`:''}`;
    }else{
      const inputs=state.inputs[id]||{};
      sections=`<h2>Dados informados</h2><table>${Object.entries(inputs).filter(([k,v])=>k!=='rows'&&typeof v!=='object').map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}${(inputs.rows||[]).map((r,i)=>`<tr><th>Linha ${i+1}</th><td>${esc(Object.values(r).filter(Boolean).join(' • '))}</td></tr>`).join('')}</table><h2>Resultados</h2><p class="big">${esc(result.headline)} <small>${esc(result.unit)}</small></p>${result.caption?`<p>${esc(result.caption)}</p>`:''}<table>${(result.details||[]).map(([a,b])=>`<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</table>${result.recommendations?.length?`<h2>Opções recomendadas</h2><ol>${result.recommendations.map(x=>`<li><b>${esc(x.title)}</b> — ${esc(x.sub)}</li>`).join('')}</ol>`:''}${result.notices?.length?`<h2>Observações</h2><ul>${result.notices.map(n=>`<li>${n.text}</li>`).join('')}</ul>`:''}`;
    }
    const doc=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(t.title)} — TollBox</title><style>*{box-sizing:border-box}body{font:14px Arial,sans-serif;color:#18384b;margin:36px auto;max-width:780px;padding:0 28px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #16877f;padding-bottom:17px;margin-bottom:26px}.brand{font-size:18px;font-weight:bold;color:#102a43}.mark{display:inline-grid;place-items:center;background:#168b82;color:#fff;width:33px;height:33px;border-radius:9px;margin-right:9px;font-size:12px}small,.muted{color:#748997;font-size:11px}h1{font-size:23px;margin:0 0 5px;color:#102a43}h2{font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#16877f;margin:23px 0 9px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #e4ebee;padding:8px 10px;text-align:left;font-size:12px;vertical-align:top}th{width:38%;color:#607887;font-weight:600}.big{font-size:22px;font-weight:bold;color:#137b75}.big small{font-size:12px;font-weight:normal}.foot{border-top:1px solid #dce6e9;margin-top:35px;padding-top:12px;font-size:10px;color:#8396a1}.actions{display:flex;gap:10px;margin:0 auto 20px;max-width:780px;padding:0 28px}button{border:0;border-radius:6px;background:#167e81;color:#fff;padding:10px 15px;font-weight:bold;cursor:pointer}@media print{body{margin:0 auto;padding:0 12px}.actions{display:none}}</style></head><body><div class="actions"><button onclick="window.print()">Imprimir / Salvar como PDF</button><button onclick="window.close()">Fechar</button></div><header><div class="brand"><span class="mark">TB</span>TollBox</div><div class="muted">${new Date().toLocaleString('pt-BR')}</div></header><h1>${esc(t.title)}</h1><div class="muted">Relatório gerado localmente • TollBox</div>${sections}<div class="foot">Estimativas e cálculos transcritos das planilhas fornecidas. Verifique as condições de projeto e os dados de catálogo antes de especificar materiais.</div></body></html>`;
    const win=window.open('','_blank');if(!win)return toast('Permita a abertura de janela para gerar o relatório.');win.document.open();win.document.write(doc);win.document.close();
  }
  function toast(message){const old=$('.toast');if(old)old.remove();const el=document.createElement('div');el.className='toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),3600);}
  function refreshResult(id){const side=$('.module-side');if(side)side.innerHTML=renderResult(id);}
  function resetModule(id){state.results[id]=null;openModule(id);}
  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-open]');if(open){e.preventDefault();openModule(open.dataset.open);return;}
    if(e.target.closest('[data-home]')){home();return;}
    const add=e.target.closest('[data-add-row]');if(add){const body=$('.entry-table tbody');if(!body)return;const id=state.active,limit=id==='vent'?74:9;if(body.children.length>=limit)return toast(`Limite de ${limit} linhas atingido.`);const html=id==='vent'?componentRow({q:'',desc:'',w:''},body.children.length):id==='trunk'?`<tr data-row><td><select name="gauge" aria-label="Bitola">${optionList([{value:'',label:'Selecione'},...sectionOptions])}</select></td><td><input name="qty" type="number" min="0" step="1" inputmode="numeric" placeholder="0" aria-label="Quantidade"></td><td><button class="remove-row" type="button" data-remove-row aria-label="Remover linha">×</button></td></tr>`:cableEntryRow(id);body.insertAdjacentHTML('beforeend',html);const row=body.lastElementChild;if(id==='conduit'||id==='tray')updateCableRow(row);updateRowCount();updateComponentTotals();return;}
    const remove=e.target.closest('[data-remove-row]');if(remove){remove.closest('tr')?.remove();updateRowCount();updateComponentTotals();return;}
    const importer=e.target.closest('[data-import-short]');if(importer){const target=importer.dataset.importShort,source=state.inputs.short?.ik;if(!Number.isFinite(Number(source)))return toast('Calcule primeiro a corrente de curto-circuito para importar o resultado.');const input=$(`#tool-form [name="${target}"]`);if(!input)return toast('O campo de destino não está disponível.');input.value=Number(source).toFixed(2);input.dispatchEvent(new Event('input',{bubbles:true}));toast(`Corrente ${fmt(source,2)} kA importada.`);return;}
    const pdfBtn=e.target.closest('[data-pdf]');if(pdfBtn){pdf(pdfBtn.dataset.pdf);return;}
    const fresh=e.target.closest('[data-new]');if(fresh){resetModule(fresh.dataset.new);return;}
    if(e.target.closest('[data-busbar]')){const f=$('#tool-form');if(f)calcBusbar(f);return;}
  });
  document.addEventListener('submit',e=>{
    if(e.target.id!=='tool-form')return;e.preventDefault();const id=state.active,f=e.target;state.results[id]=null;refreshResult(id);
    if(id==='survey')calculateSurvey(f);else if(id==='vent')calculateVent(f);else if(id==='short')calculateShort(f);else if(id==='conduit')calculateConduit(f);else if(id==='tray')calculateTray(f);else if(id==='trunk')calculateTrunk(f);
  });
  document.addEventListener('input',e=>{if(e.target.matches('[data-range-output]')){const output=$(`[data-range-label="${e.target.dataset.rangeOutput}"]`);if(output)output.textContent=`${e.target.value} °C`;}if(e.target.closest('[data-row]'))updateComponentTotals();if(e.target.closest('#tool-form')&&state.results[state.active]){state.results[state.active]=null;refreshResult(state.active);}});
  document.addEventListener('change',e=>{const row=e.target.closest('[data-row]');if(row&&(e.target.name==='gauge'||e.target.name==='cableType'))updateCableRow(row);if(e.target.matches('[name="busRho"],[name="busThickness"],[name="busWidth"]')){const key=e.target.name==='busRho'?'rho':e.target.name==='busThickness'?'thickness':'width',box=$(`[data-bus-custom="${key}"]`);if(box){box.hidden=e.target.value!=='custom';const input=box.querySelector('input');if(input)input.required=e.target.value==='custom';}}if(e.target.closest('#tool-form')&&state.results[state.active]){state.results[state.active]=null;refreshResult(state.active);}});
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.tool-card')){e.preventDefault();openModule(e.target.dataset.open);}});
  document.querySelectorAll('[data-home]').forEach(x=>x.addEventListener('click',home));
  home();
})();
