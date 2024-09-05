<template>
  <v-container>
    <v-card class="pa-5">
      <v-card-title>Registrarse</v-card-title>
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
          :rules="[rules.required, rules.min]"
          type="password"
          outlined
        />
        <v-btn @click="register" :disabled="!valid">Registrarse</v-btn>
      </v-form>
      <v-btn text @click="$router.push('/login')">Iniciar Sesión</v-btn>
    </v-card>
  </v-container>
</template>

<script>
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase"; // Asegúrate de importar la instancia de Firestore

export default {
  data() {
    return {
      email: "",
      password: "",
      valid: false,
      rules: {
        required: (v) => !!v || "Este campo es obligatorio",
        email: (v) => /.+@.+\..+/.test(v) || "Correo inválido",
        min: (v) => v.length >= 6 || "Mínimo 6 caracteres",
      },
    };
  },
  methods: {
    async register() {
      try {
        // Crear usuario con Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          this.email,
          this.password
        );
        const user = userCredential.user;

        // Guardar información adicional en Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: this.email,
          createdAt: new Date(),
          // Puedes añadir más campos si es necesario
        });

        // Redirigir al usuario a la página de listas
        this.$router.push("/listas");
      } catch (error) {
        console.error("Error al registrarse:", error);
      }
    },
  },
};
</script>
