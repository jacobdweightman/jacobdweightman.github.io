# 1D Linear Bar
#
# Consider a bar of uncompressed length L. Fix the left end at the origin, and
# point the bar along the +x axis. Apply a force F at the right end, which will
# stretch or compress the bar so that the right end is no longer at x=L.
#
# The bar has a Young's modulus and cross sectional area EA that may vary along
# the length of the bar. In order to understand how this variation works, and
# how the bar stretches or compresses along its length, we need material
# coordinates: this coordinate X ranges from 0 to L, and corresponds to the part
# of the bar that "started out" at that position before the force was applied.
# For example, X = 0 is the left end of the bar, X = L is the right end of the
# bar, and in general there's some displacement u(X) that tells us how far the
# piece of the bar at X is from where it started. This means that x = X + u(X).
#
# Ignoring any "internal loads" on the bar (like the weight of the bar itself),
# we have this equation for the balance of forces:
#
# d/dX [EA(X) * du/dX] = 0   <==> [EA(X) u']' = 0
#
# This is the ODE we will solve with the finite element method.

import numpy as np

F = 1.0
k = 1.0
a = 10.0
L = 1.0

def analytic_solution(X: np.ndarray):
    """Analytic solution for EA(X) = k(1 + X/L)

    equation becomes u' + (1 + X)u'' = 0, which is separable:
    u''/u' = -1 / (1 + X/L)
    => u' = C1 / (1 + X/L)
    => u = C1 ln(1 + X/L) + C2

    Boundary conditions:
    u(0) = 0  =>  C2 = 0
    EA(L)u'(L) = F  =>  C1 = F/k

    Therefore:
    u(X) = F/k ln(1 + X/L)
    """
    u = (F * L / (a * k)) * np.log(1 + a * X / L)
    return u

def EA(X):
    return 1 + a * X / L

def element_stiffness(EA, h):
    """Stiffness matrix for a rod element of stiffness EA and length h"""
    return (EA / h) * np.array([
        [1, -1],
        [-1, 1],
    ])

def finite_element_method(X):
    assert len(X) >= 2
    element_count = len(X) - 1
    node_count = len(X)

    K = np.zeros((node_count, node_count))
    f = np.zeros(node_count)

    # Assemble the stiffness matrix
    for e in range(element_count):
        n1, n2 = e, e + 1
        midpoint = (X[n1] + X[n2]) / 2
        h = X[n2] - X[n1]
        ke = element_stiffness(EA(midpoint), h)

        dofs = [n1, n2]
        for i_local, i_global in enumerate(dofs):
            # f[i_global] += fe[i_local]
            for j_local, j_global in enumerate(dofs):
                K[i_global, j_global] += ke[i_local, j_local]

    # Apply force at free end
    f[-1] += F

    # Apply Dirichlet BC: u(0) = 0 via row/col elimination
    free_dofs = list(range(1, node_count))  # everything except node 0
    K_ff = K[np.ix_(free_dofs, free_dofs)]
    f_f = f[free_dofs]

    u = np.zeros(node_count)
    u[free_dofs] = np.linalg.solve(K_ff, f_f)
    # u[0] stays 0 by construction

    return u

import matplotlib.pyplot as plt

# # Convergence plot
# N = np.arange(5, 50, 5)
# Err = []
# for n in N:
#     X = np.linspace(0, L, num=n)
#     u1 = finite_element_method(X)
#     u2 = analytic_solution(X)
#     h = L / (n - 1)
#     err = np.sqrt(h) * np.linalg.norm(u2 - u1)
#     Err.append(err)
# Err = np.array(Err)

# log_h = np.log(1 / N)
# log_err = np.log(Err)

# slope, intercept = np.polyfit(log_h, log_err, 1)
# print(f"Observed convergence order: {slope:.2f}")

# plt.xlabel("number of segments")
# plt.ylabel(r"$L^2$ error")
# plt.loglog(N, Err, '.')
# fit_err = np.exp(intercept) * N.astype(float) ** (-slope)
# plt.loglog(N, fit_err, '-')
# plt.show()

# Compare a single FEM solution vs analytic
X = np.linspace(0, L, num=100)
u = analytic_solution(X)
plt.plot(X, u, label="analytic")

X = np.linspace(0, L, num=6) # increase `num` to decrease error
u = finite_element_method(X)
plt.plot(X, u, label="5 elements")

X = np.linspace(0, L, num=51)
u = finite_element_method(X)
plt.plot(X, u, label="50 elements")

plt.title("Displacement vs Material Coordinate")
plt.xlabel("material coordinate")
plt.ylabel("displacement")
plt.legend()
plt.show()
