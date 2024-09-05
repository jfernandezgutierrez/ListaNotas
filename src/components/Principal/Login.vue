<template>
  <v-container>
    <v-card class="pa-5">
      <v-card-title>Iniciar Sesión</v-card-title>
      <v-form v-model="valid" ref="form">
        <v-text-field
          label="Correo Electrónico"
          v-model="email"
          :rules="[rules.required, rules.email]"
          outlined
        />
        <v-text-field
          label="Contraseña"
          v-model="password"
          :rules="[rules.required]"
          type="password"
          outlined
        />
        <v-btn @click="login" :disabled="!valid">Iniciar Sesión</v-btn>
      </v-form>
      <v-btn text @click="$router.push('/register')">Registrarse</v-btn>
    </v-card>
  </v-container>
</template>

<script>
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

export default {
  data() {
    return {
      email: "",
      password: "",
      valid: false,
      rules: {
        required: (v) => !!v || "Este campo es obligatorio",
        email: (v) => /.+@.+\..+/.test(v) || "Correo inválido",
      },
    };
  },
  methods: {
    async login() {
      try {
        await signInWithEmailAndPassword(auth, this.email, this.password);
        this.$router.push("/listas");
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
      }
    },
  },
};
</script>
