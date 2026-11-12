export class Usuario {
  id: number;
  contaId: number;
  nome: string;

  constructor(props: { id: number; nome: string; contaId: number }) {
    this.id = props.id;
    this.contaId = props.contaId;
    this.nome = props.nome;
  }
}
