export class Usuario {
  id: number;
  nome: string;

  constructor(props: { id: number; nome: string }) {
    this.id = props.id;
    this.nome = props.nome;
  }
}
