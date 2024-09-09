<template>
  <v-container>
    <v-card class="pa-5">
      <v-card-title>
        <v-row align="center" justify="space-between" no-gutters>
          <v-col>
            <span>Bienvenido, {{ user?.email }}</span>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn @click="showModal = true" icon>
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn @click="logout" class="ml-3" color="error" icon>
              <v-icon>mdi-logout</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <!-- Mostrar las listas creadas -->
      <v-list>
        <v-list-item-group>
          <v-list-item
            v-for="(list, index) in lists"
            :key="index"
            class="mb-4"
          >
            <v-card class="w-100">
              <v-card-title>
                {{ list.name }}
              </v-card-title>
              <v-card-subtitle>
                {{ list.description }}
              </v-card-subtitle>
              <v-card-actions>
                <v-btn @click="openListDialog(list)" color="primary">
                  Ver
                </v-btn>
                <v-btn @click="deleteList(list.id)" color="error">
                  Eliminar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-list-item>
        </v-list-item-group>
      </v-list>

      <!-- Modal para agregar lista -->
      <v-dialog v-model="showModal" max-width="600px">
        <v-card>
          <v-card-title>
            Crear Nueva Lista
            <v-spacer></v-spacer>
            <v-btn @click="showModal = false" icon>
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-subtitle>
            <v-text-field
              v-model="listName"
              label="Nombre de Lista"
              outlined
              dense
            ></v-text-field>
            <v-checkbox
              v-model="isReminder"
              label="Recordatorio"
              dense
            ></v-checkbox>
            <v-select
              v-if="isReminder"
              v-model="reminderType"
              :items="['Semanal', 'Por Fecha']"
              label="Tipo de Recordatorio"
              outlined
              dense
            ></v-select>
            <v-select
              v-if="isReminder && reminderType === 'Semanal'"
              v-model="reminderDay"
              :items="[
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
                'Domingo',
              ]"
              label="Día de la Semana"
              outlined
              dense
            ></v-select>
            <v-date-picker
              v-if="isReminder && reminderType === 'Por Fecha'"
              v-model="reminderDate"
              label="Fecha del Recordatorio"
              outlined
              dense
            ></v-date-picker>

            <!-- Sección para agregar múltiples descripciones -->
            <div v-for="(description, index) in descriptions" :key="index">
              <v-text-field
                v-model="description.text"
                label="Descripción"
                v-bind="attrs"
                v-on="on"
                required
              ></v-text-field>
            </div>
            <!-- Botón para agregar más descripciones -->
            <v-btn @click="addDescription" icon color="primary">
              <v-icon>mdi-plus</v-icon> Añadir otra descripción
            </v-btn>
          </v-card-subtitle>
          <v-card-actions>
            <v-btn @click="addItem" color="primary">Agregar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo para ver lista y sus descripciones -->
      <v-dialog v-model="showListDialog" max-width="600px">
        <v-card>
          <v-card-title>
            {{ selectedList.name }}
            <v-spacer></v-spacer>
            <v-btn @click="showListDialog = false" icon>
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-subtitle>
            <!-- Mostrar cada descripción con un checkbox -->
            <v-row v-for="(description, index) in selectedList.descriptions" :key="index">
              <v-col cols="8">
                <span>{{ description.text }}</span>
              </v-col>
              <v-col cols="4">
                <v-checkbox
                  v-model="description.completo"
                  :value="1"
                  :false-value="0"
                  @change="toggleComplete(index)"
                  color="success"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-card-subtitle>
          <v-card-actions>
            <v-btn @click="saveChanges" color="primary">Guardar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>

<script>
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Asegúrate de tener la instancia de Firestore exportada desde firebase.js

export default {
  data() {
    return {
      user: null,
      showModal: false,
      showListDialog: false, // Controla la visualización del diálogo para ver una lista
      listName: "",
      isReminder: false,
      reminderType: "",
      reminderDay: "",
      reminderDate: null,
      descriptions: [{ text: "", completo: 0 }],
      lists: [], // Aquí almacenaremos las listas
      selectedList: {}, // Lista seleccionada para ver sus descripciones
      errorMessage: "",
    };
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.user = user;
        this.fetchLists(); // Obtener las listas al cargar el componente
      } else {
        this.$router.push("/login");
      }
    });
  },
  methods: {
    async logout() {
      try {
        await signOut(auth);
        this.$router.push("/login");
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    },
    addDescription() {
      const newDescription = { text: "", completo: 0 };
      const descriptionExists = this.descriptions.some(
        (description) => description.text === newDescription.text
      );
      if (descriptionExists) {
        this.errorMessage = "La descripción ya existe. No se pueden repetir.";
      } else {
        this.descriptions.push(newDescription);
        this.errorMessage = "";
      }
    },
    async addItem() {
      try {
        if (this.user) {
          const listData = {
            name: this.listName,
            reminder: this.isReminder
              ? {
                  type: this.reminderType,
                  day: this.reminderDay,
                  date: this.reminderDate,
                }
              : null,
            descriptions: this.descriptions,
            userId: this.user.uid,
          };
          await addDoc(collection(db, "lists"), listData);
          this.showModal = false;
          this.listName = "";
          this.isReminder = false;
          this.reminderType = "";
          this.reminderDay = "";
          this.reminderDate = null;
          this.descriptions = [{ text: "", completo: 0 }];
          this.fetchLists(); // Actualizar las listas después de agregar una nueva
        }
      } catch (error) {
        console.error("Error al agregar la lista:", error);
      }
    },
    async fetchLists() {
      try {
        const querySnapshot = await getDocs(collection(db, "lists"));
        this.lists = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id, // Almacenar el ID del documento para poder eliminarlo
        }));
      } catch (error) {
        console.error("Error al obtener las listas:", error);
      }
    },
    async deleteList(listId) {
      try {
        await deleteDoc(doc(db, "lists", listId));
        this.fetchLists(); // Actualizar las listas después de eliminar
      } catch (error) {
        console.error("Error al eliminar la lista:", error);
      }
    },
    openListDialog(list) {
      this.selectedList = { ...list }; // Hacer una copia de la lista seleccionada
      this.showListDialog = true; // Mostrar el diálogo
    },
    toggleComplete(index) {
      // Invertir el valor de 'completo' en la descripción seleccionada
      this.selectedList.descriptions[index].completo = this.selectedList.descriptions[index].completo === 1 ? 0 : 1;
    },
    async saveChanges() {
      try {
        const listRef = doc(db, "lists", this.selectedList.id);
        await updateDoc(listRef, {
          descriptions: this.selectedList.descriptions,
        });
        this.showListDialog = false; // Cerrar el diálogo al guardar
        this.fetchLists(); // Actualizar las listas
      } catch (error) {
        console.error("Error al guardar los cambios:", error);
      }
    },
  },
};
</script>
